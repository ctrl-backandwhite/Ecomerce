/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaProductAdminRepository                                  ║
 * ║                                                              ║
 * ║  CRUD operations for products against the NX036               ║
 * ║  mic-productcategory API:                                    ║
 * ║    GET    /api/v1/products          (paged list)             ║
 * ║    GET    /api/v1/products/:id      (detail)                 ║
 * ║    POST   /api/v1/products          (create)                 ║
 * ║    PUT    /api/v1/products/:id      (update)                 ║
 * ║    DELETE /api/v1/products/:id      (delete)                 ║
 * ║    POST   /api/v1/products/sync     (sync from CJ)           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { ApiError, NetworkError } from "../lib/AppError";
import { authFetch } from "../lib/authFetch";
import { API_CATALOG } from "../config/api";

import { logger } from "../lib/logger";

// ── API base URL ─────────────────────────────────────────────────────────────
const BASE_URL = `${API_CATALOG}/api/v1/products`;

// ── API types ────────────────────────────────────────────────────────────────

export interface ProductTranslation {
    locale: string;
    name: string;
}

export interface VariantTranslation {
    locale: string;
    variantName: string | null;
}

export interface VariantInventory {
    id: number;
    countryCode: string;
    totalInventory: number;
    cjInventory: number;
    factoryInventory: number;
    verifiedWarehouse: number;
}

export interface ProductVariant {
    vid: string;
    pid: string;
    status: "DRAFT" | "PUBLISHED";
    variantNameEn: string;
    variantSku: string;
    variantUnit: string;
    variantKey: string;
    variantImage: string;
    variantLength: number;
    variantWidth: number;
    variantHeight: number;
    variantVolume: number;
    variantWeight: number;
    variantSellPrice: number;
    variantSugSellPrice: number;
    variantStandard: string | null;
    createTime: string | null;
    createdAt: string;
    updatedAt: string | null;
    translations: VariantTranslation[];
    inventories: VariantInventory[];
}

export interface AdminProduct {
    id: string;
    sku: string;
    categoryId: string;
    name: string;
    status: "DRAFT" | "PUBLISHED";
    bigImage: string;
    sellPrice: string;
    productType: string;
    listedNum: number;
    warehouseInventoryNum: number;
    isVideo: boolean;
    warrantyId?: string | null;
    createdAt: string;
    updatedAt: string | null;
    translations: ProductTranslation[];
    variants: ProductVariant[];
}

export interface AdminProductPage {
    content: AdminProduct[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/** Query parameters for the paged endpoint. */
export interface AdminProductQuery {
    locale?: string;
    categoryId?: string;
    status?: string;
    name?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    ascending?: boolean;
}

/** Payload for creating / updating a product (variants come from CJ detail fetch only). */
export interface ProductPayload {
    sku?: string;
    categoryId: string;
    bigImage?: string;
    productImageSet?: string;
    sellPrice?: string;
    productType?: string;
    description?: string;
    listedNum?: number;
    warehouseInventoryNum?: number;
    isVideo?: boolean;
    warrantyId?: string | null;
    translations: { locale: string; name: string }[];
}

/** Result of a bulk import operation. */
export interface BulkImportResult {
    created: number;
    failed: number;
    totalRows: number;
    errors: { row: number; message: string }[];
}

interface ApiErrorBody {
    code: string;
    message: string;
    details: string[];
    timeStamp: string;
}

/** Progress info emitted during discover-by-category */
export interface DiscoverProgress {
    current: number;
    total: number;
    created: number;
    updated: number;
}

/** Progress info emitted after every successful sync page */
export interface SyncProgress {
    /** Page that just finished (1-based). */
    page: number;
    created: number;
    updated: number;
    skipped: number;
    /** Whether the backend says there's another page to fetch. */
    hasMore: boolean;
}

/** Persisted discover state so it survives page refreshes */
export interface DiscoverState {
    running: boolean;
    offset: number;
    totalCategories: number;
    created: number;
    updated: number;
    startedAt: number; // epoch ms
}

const DISCOVER_STATE_KEY = "nx036_discover_state";

function saveDiscoverState(state: DiscoverState): void {
    try { localStorage.setItem(DISCOVER_STATE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}
export function clearDiscoverState(): void {
    try { localStorage.removeItem(DISCOVER_STATE_KEY); } catch { /* noop */ }
}
export function loadDiscoverState(): DiscoverState | null {
    try {
        const raw = localStorage.getItem(DISCOVER_STATE_KEY);
        if (!raw) return null;
        const state = JSON.parse(raw) as DiscoverState;
        // Expire after 24 hours to avoid stale state
        if (Date.now() - state.startedAt > 24 * 60 * 60 * 1000) {
            clearDiscoverState();
            return null;
        }
        return state;
    } catch { return null; }
}

/**
 * Persisted sync state so a product sync can resume exactly where it left off
 * when the browser reloads, the JWT expires and the user re-authenticates, or
 * the user accidentally navigates away. Mirrors the DiscoverState pattern.
 */
export interface SyncState {
    running: boolean;
    nextPage: number;
    categoryIds: string[];
    forceOverwrite: boolean;
    totalCreated: number;
    totalUpdated: number;
    totalSkipped: number;
    startedAt: number;
}

const SYNC_STATE_KEY = "nx036_sync_state";

function saveSyncState(state: SyncState): void {
    try { localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}
export function clearSyncState(): void {
    try { localStorage.removeItem(SYNC_STATE_KEY); } catch { /* noop */ }
}
export function loadSyncState(): SyncState | null {
    try {
        const raw = localStorage.getItem(SYNC_STATE_KEY);
        if (!raw) return null;
        const state = JSON.parse(raw) as SyncState;
        if (Date.now() - state.startedAt > 24 * 60 * 60 * 1000) {
            clearSyncState();
            return null;
        }
        return state;
    } catch { return null; }
}

// ── Repository ───────────────────────────────────────────────────────────────

class NexaProductAdminRepository {
    /**
     * Paginated product list with optional filters.
     */
    async findPaged(query: AdminProductQuery = {}): Promise<AdminProductPage> {
        try {
            const params = new URLSearchParams();
            if (query.locale) params.set("locale", query.locale);
            if (query.categoryId) params.set("categoryId", query.categoryId);
            if (query.status) params.set("status", query.status);
            if (query.name) params.set("name", query.name);
            if (query.page !== undefined) params.set("page", String(query.page));
            if (query.size !== undefined) params.set("size", String(query.size));
            if (query.sortBy) params.set("sortBy", query.sortBy);
            if (query.ascending !== undefined) params.set("ascending", String(query.ascending));
            // Admin panel must see products in every status. The backend
            // defaults to Elasticsearch (PUBLISHED only) when this flag is off.
            params.set("includeDrafts", "true");
            const url = `${BASE_URL}?${params.toString()}`;
            const res = await authFetch(url);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as AdminProductPage;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Get a single product by ID.
     */
    async findById(productId: string, locale: string = "en"): Promise<AdminProduct> {
        try {
            const params = new URLSearchParams({ locale });
            const res = await authFetch(`${BASE_URL}/${productId}?${params.toString()}`);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as AdminProduct;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Create a new product.
     */
    async createProduct(data: ProductPayload): Promise<AdminProduct> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as AdminProduct;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Update an existing product.
     */
    async updateProduct(productId: string, data: ProductPayload): Promise<AdminProduct> {
        try {
            const res = await authFetch(`${BASE_URL}/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as AdminProduct;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Delete one or more products by IDs.
     */
    async deleteProducts(productIds: string[]): Promise<void> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productIds),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk create products from a JSON array.
     */
    async bulkCreate(rows: ProductPayload[]): Promise<BulkImportResult> {
        try {
            const res = await authFetch(`${BASE_URL}/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as BulkImportResult;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Toggle product publish status (DRAFT ↔ PUBLISHED).
     */
    async togglePublish(productId: string): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/${productId}/publish`, { method: "PATCH" });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo cambiar el estado del producto",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk update status for multiple products.
     */
    async bulkUpdateStatus(productIds: string[], status: "DRAFT" | "PUBLISHED"): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/bulk-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: productIds, status }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo cambiar el estado de los productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Publishes every product currently in DRAFT. Returns the number affected.
     */
    async publishAllDrafts(): Promise<number> {
        try {
            const res = await authFetch(`${BASE_URL}/publish-all-drafts`, { method: "PATCH" });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            const data = (await res.json()) as { published: number };
            return data.published ?? 0;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo publicar los borradores",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /** Active AbortController for the current sync – null when idle */
    private syncAbortController: AbortController | null = null;

    /** Active AbortController for the current discover – null when idle */
    private discoverAbortController: AbortController | null = null;

    /** Returns true when a sync loop is in progress */
    get isSyncing(): boolean {
        return this.syncAbortController !== null;
    }

    /** Returns true when a discover loop is in progress */
    get isDiscovering(): boolean {
        return this.discoverAbortController !== null;
    }

    /** Cancels the running sync (if any). Safe to call when idle.
     *  Also clears persisted state so a remount doesn't prompt to resume
     *  what the user just explicitly stopped. */
    cancelSync(): void {
        if (this.syncAbortController) {
            this.syncAbortController.abort();
            this.syncAbortController = null;
            logger.debug(
                "%c[CJ Sync] ⏹ Sincronización detenida por el usuario.",
                "color: #f59e0b; font-weight: bold",
            );
        }
        clearSyncState();
    }

    /** Cancels the running discover (if any). Safe to call when idle.
     *  Also clears persisted state so a remount doesn't prompt to resume
     *  what the user just explicitly stopped. */
    cancelDiscover(): void {
        if (this.discoverAbortController) {
            this.discoverAbortController.abort();
            this.discoverAbortController = null;
            logger.debug(
                "%c[CJ Discover] ⏹ Descubrimiento detenido por el usuario.",
                "color: #f59e0b; font-weight: bold",
            );
        }
        clearDiscoverState();
    }

    /**
     * Syncs products from CJ Dropshipping, iterating page by page (100 per page).
     * Waits 10 seconds between each page call and logs progress to the console.
     * Can be cancelled at any time by calling cancelSync().
     */
    async syncProducts(
        forceOverwrite = true,
        categoryIds: string[] = [],
        startPage = 1,
        accCreated = 0,
        accUpdated = 0,
        accSkipped = 0,
        onProgress?: (progress: SyncProgress) => void,
    ): Promise<{ created: number; updated: number; skipped: number; total: number }> {
        // If already syncing, cancel first
        if (this.syncAbortController) {
            this.cancelSync();
            return { created: 0, updated: 0, skipped: 0, total: 0 };
        }

        const abortCtrl = new AbortController();
        this.syncAbortController = abortCtrl;

        const PAGE_SIZE = 100;
        const DELAY_MS = 10_000;

        let totalCreated = accCreated;
        let totalUpdated = accUpdated;
        let totalSkipped = accSkipped;
        let page = startPage;
        let cancelled = false;
        const startedAt = Date.now();
        // Seed the resume row so a reload or session expiry mid-page still
        // restores the right context (page number + accumulated counters).
        saveSyncState({
            running: true, nextPage: page, categoryIds, forceOverwrite,
            totalCreated, totalUpdated, totalSkipped, startedAt,
        });

        logger.debug(
            "%c[CJ Sync] Iniciando sincronización de productos (páginas de %d)…",
            "color: #2563eb; font-weight: bold",
            PAGE_SIZE,
        );

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // Check abort before each page
                if (abortCtrl.signal.aborted) {
                    cancelled = true;
                    break;
                }

                const rangeStart = (page - 1) * PAGE_SIZE + 1;
                const rangeEnd = page * PAGE_SIZE;

                logger.debug(
                    `%c[CJ Sync] Página ${page} → productos ${rangeStart}–${rangeEnd}…`,
                    "color: #0891b2",
                );

                const catParam = categoryIds.length > 0 ? `&categoryIds=${categoryIds.join(",")}` : "";

                const res = await authFetch(
                    `${BASE_URL}/sync/page?page=${page}&size=${PAGE_SIZE}&forceOverwrite=${forceOverwrite}${catParam}`,
                    { method: "POST", headers: { accept: "*/*" }, signal: abortCtrl.signal },
                );

                if (!res.ok) {
                    let errorMsg = `HTTP ${res.status}`;
                    try {
                        const errBody: ApiErrorBody = await res.json();
                        errorMsg = errBody.message || errorMsg;
                    } catch (err) { logger.warn("Suppressed error", err); }
                    throw new ApiError(res.status, errorMsg);
                }

                const result = (await res.json()) as {
                    created: number;
                    updated: number;
                    skipped: number;
                    total: number;
                    page: number;
                    hasMore: boolean;
                };

                totalCreated += result.created;
                totalUpdated += result.updated;
                totalSkipped += result.skipped;

                logger.debug(
                    `%c[CJ Sync] Página ${page} completada: ` +
                    `+${result.created} creados, ~${result.updated} actualizados, =${result.skipped} sin cambios ` +
                    `(acumulado: ${totalCreated} creados, ${totalUpdated} actualizados, ${totalSkipped} sin cambios)`,
                    "color: #16a34a",
                );

                // Emit live progress so the admin toast updates after every page.
                onProgress?.({
                    page,
                    created: totalCreated,
                    updated: totalUpdated,
                    skipped: totalSkipped,
                    hasMore: result.hasMore,
                });

                if (!result.hasMore) {
                    logger.debug(
                        "%c[CJ Sync] ✓ Sincronización finalizada. " +
                        `Total: ${totalCreated} creados, ${totalUpdated} actualizados, ${totalSkipped} sin cambios ` +
                        `(${totalCreated + totalUpdated} procesados)`,
                        "color: #2563eb; font-weight: bold",
                    );
                    break;
                }

                // Persist progress after every successful page so a reload,
                // JWT refresh or accidental navigation can resume from the
                // next page without repeating work.
                saveSyncState({
                    running: true, nextPage: page + 1, categoryIds, forceOverwrite,
                    totalCreated, totalUpdated, totalSkipped, startedAt,
                });

                // Wait 10 seconds before next page — also abortable
                logger.debug(
                    `%c[CJ Sync] Esperando ${DELAY_MS / 1000}s antes de la siguiente página…`,
                    "color: #9333ea",
                );
                await new Promise<void>((resolve) => {
                    const timer = setTimeout(resolve, DELAY_MS);
                    abortCtrl.signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
                });
                page++;
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                cancelled = true;
            } else {
                // Checkpoint only on real failures. When the failure is a 401 we
                // treat it as "pending re-auth" and keep running=true so the
                // auto-resume on /admin/products picks up without the admin
                // having to click Sync again — the OAuth callback restores valid
                // tokens mid-session. Explicit user cancel skips this and clears
                // below, so the next visit starts clean.
                const isAuthBounce = err instanceof ApiError && err.statusCode === 401;
                saveSyncState({
                    running: isAuthBounce, nextPage: page, categoryIds, forceOverwrite,
                    totalCreated, totalUpdated, totalSkipped, startedAt,
                });
                console.error(
                    `%c[CJ Sync] ✗ Error en página ${page}:`,
                    "color: #dc2626; font-weight: bold",
                    err,
                );
                throw err instanceof ApiError
                    ? err
                    : new NetworkError(
                        "No se pudo sincronizar los productos",
                        err instanceof Error ? err : undefined,
                    );
            }
        } finally {
            this.syncAbortController = null;
        }

        if (cancelled) {
            logger.debug(
                "%c[CJ Sync] ⏹ Detenida por el usuario. " +
                `Parcial: ${totalCreated} creados, ${totalUpdated} actualizados, ${totalSkipped} sin cambios ` +
                `(${totalCreated + totalUpdated} procesados hasta página ${page}). ` +
                `Estado de reanudación limpiado.`,
                "color: #f59e0b; font-weight: bold",
            );
            clearSyncState();
        } else {
            clearSyncState();
        }

        return { created: totalCreated, updated: totalUpdated, skipped: totalSkipped, total: totalCreated + totalUpdated };
    }

    /**
     * Discovers NEW products from CJ by iterating synced L3 categories.
     * Processes one category per backend call, iterating offset until done.
     * Waits 2 seconds between calls to respect rate limits.
     * Can be cancelled at any time by calling cancelDiscover().
     *
     * @param onProgress Optional callback invoked after each category is processed.
     * @param startOffset Resume from this category offset (default 0).
     * @param accCreated Accumulated created count when resuming.
     * @param accUpdated Accumulated updated count when resuming.
     */
    async discoverByCategory(
        onProgress?: (progress: DiscoverProgress) => void,
        startOffset = 0,
        accCreated = 0,
        accUpdated = 0,
    ): Promise<{ created: number; updated: number; total: number }> {
        if (this.discoverAbortController) {
            this.cancelDiscover();
            return { created: 0, updated: 0, total: 0 };
        }

        const abortCtrl = new AbortController();
        this.discoverAbortController = abortCtrl;

        const DELAY_MS = 2_000;

        let totalCreated = accCreated;
        let totalUpdated = accUpdated;
        let offset = startOffset;
        let totalCategories = 0;
        let cancelled = false;

        saveDiscoverState({
            running: true, offset, totalCategories: 0,
            created: totalCreated, updated: totalUpdated,
            startedAt: Date.now(),
        });

        logger.debug(
            "%c[CJ Discover] Iniciando descubrimiento de productos por categoría…",
            "color: #7c3aed; font-weight: bold",
        );

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (abortCtrl.signal.aborted) {
                    cancelled = true;
                    break;
                }

                logger.debug(
                    `%c[CJ Discover] Categoría ${offset + 1}${totalCategories ? "/" + totalCategories : ""}…`,
                    "color: #7c3aed",
                );

                const res = await authFetch(
                    `${BASE_URL}/sync/discover/page?offset=${offset}`,
                    { method: "POST", headers: { accept: "*/*" }, signal: abortCtrl.signal },
                );

                if (!res.ok) {
                    let errorMsg = `HTTP ${res.status}`;
                    try {
                        const errBody: ApiErrorBody = await res.json();
                        errorMsg = errBody.message || errorMsg;
                    } catch (err) { logger.warn("Suppressed error", err); }
                    throw new ApiError(res.status, errorMsg);
                }

                const result = (await res.json()) as {
                    created: number;
                    updated: number;
                    total: number;
                    page: number;
                    hasMore: boolean;
                    totalCategories: number;
                };

                if (result.totalCategories > 0) totalCategories = result.totalCategories;

                totalCreated += result.created;
                totalUpdated += result.updated;

                // Persist state so it survives page refresh
                saveDiscoverState({
                    running: true, offset, totalCategories,
                    created: totalCreated, updated: totalUpdated,
                    startedAt: Date.now(),
                });

                // Notify progress to caller
                onProgress?.({
                    current: offset + 1,
                    total: totalCategories,
                    created: totalCreated,
                    updated: totalUpdated,
                });

                if (result.created > 0 || result.updated > 0) {
                    logger.debug(
                        `%c[CJ Discover] Cat ${offset + 1}/${totalCategories}: ` +
                        `+${result.created} nuevos, ~${result.updated} actualizados ` +
                        `(acumulado: ${totalCreated} nuevos, ${totalUpdated} actualizados)`,
                        "color: #16a34a",
                    );
                }

                if (!result.hasMore) {
                    clearDiscoverState();
                    logger.debug(
                        "%c[CJ Discover] ✓ Descubrimiento finalizado. " +
                        `${totalCategories} categorías procesadas. ` +
                        `Total: ${totalCreated} nuevos, ${totalUpdated} actualizados`,
                        "color: #7c3aed; font-weight: bold",
                    );
                    break;
                }

                // Short delay between categories (2s) — CJ rate limited
                await new Promise<void>((resolve) => {
                    const timer = setTimeout(resolve, DELAY_MS);
                    abortCtrl.signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
                });
                offset++;
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                cancelled = true;
            } else {
                // A 401 is the auth-expiry bounce, not a real failure; keep
                // running=true so the admin panel auto-resumes after the
                // OAuth round-trip restores valid tokens. Any other error is
                // a genuine stop and still surfaces the "press ▶" toast.
                const isAuthBounce = err instanceof ApiError && err.statusCode === 401;
                saveDiscoverState({
                    running: isAuthBounce, offset, totalCategories,
                    created: totalCreated, updated: totalUpdated,
                    startedAt: Date.now(),
                });
                console.error(
                    `%c[CJ Discover] ✗ Error en categoría ${offset + 1}:`,
                    "color: #dc2626; font-weight: bold",
                    err,
                );
                throw err instanceof ApiError
                    ? err
                    : new NetworkError(
                        "No se pudo descubrir productos nuevos",
                        err instanceof Error ? err : undefined,
                    );
            }
        } finally {
            this.discoverAbortController = null;
        }

        if (cancelled) {
            clearDiscoverState();
            logger.debug(
                "%c[CJ Discover] ⏹ Detenido por el usuario. " +
                `Parcial: ${totalCreated} nuevos, ${totalUpdated} actualizados ` +
                `(hasta categoría ${offset + 1}/${totalCategories}). ` +
                `Estado de reanudación limpiado.`,
                "color: #f59e0b; font-weight: bold",
            );
        }

        return { created: totalCreated, updated: totalUpdated, total: totalCreated + totalUpdated };
    }

    /**
     * Triggers an incremental reindex of all products from PostgreSQL → Elasticsearch.
     * Does NOT delete the existing index; only upserts documents.
     * Returns the total number of documents indexed.
     */
    async reindexFromDb(): Promise<{ status: string; operation: string; totalIndexed: number }> {
        try {
            const res = await authFetch(`${API_CATALOG}/api/v1/sync/reindex/elasticsearch/from-db`, {
                method: "POST",
                headers: { accept: "application/json" },
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as { status: string; operation: string; totalIndexed: number };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo reindexar los productos en Elasticsearch",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Triggers a full reindex (delete index + recreate + reindex all) from PostgreSQL → Elasticsearch.
     * Use when the mapping changes. Slower than reindexFromDb.
     */
    async reindexAll(): Promise<{ status: string; operation: string; totalIndexed: number }> {
        try {
            const res = await authFetch(`${API_CATALOG}/api/v1/sync/reindex/elasticsearch`, {
                method: "POST",
                headers: { accept: "application/json" },
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as { status: string; operation: string; totalIndexed: number };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo reindexar los productos en Elasticsearch",
                err instanceof Error ? err : undefined,
            );
        }
    }
}

export const nexaProductAdminRepository = new NexaProductAdminRepository();
