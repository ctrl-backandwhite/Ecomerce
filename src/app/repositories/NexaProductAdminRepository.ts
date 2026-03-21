/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaProductAdminRepository                                  ║
 * ║                                                              ║
 * ║  CRUD operations for products against the NEXA               ║
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

// ── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:6001";
const BASE_URL = `${API_BASE}/api/v1/products`;

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
            const url = `${BASE_URL}?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(`${BASE_URL}/${productId}?${params.toString()}`);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(`${BASE_URL}/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(BASE_URL, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productIds),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(`${BASE_URL}/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(`${BASE_URL}/${productId}/publish`, { method: "PATCH" });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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
            const res = await fetch(`${BASE_URL}/bulk-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: productIds, status }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
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

    /** Active AbortController for the current sync – null when idle */
    private syncAbortController: AbortController | null = null;

    /** Returns true when a sync loop is in progress */
    get isSyncing(): boolean {
        return this.syncAbortController !== null;
    }

    /** Cancels the running sync (if any). Safe to call when idle. */
    cancelSync(): void {
        if (this.syncAbortController) {
            this.syncAbortController.abort();
            this.syncAbortController = null;
            console.log(
                "%c[CJ Sync] ⏹ Sincronización detenida por el usuario.",
                "color: #f59e0b; font-weight: bold",
            );
        }
    }

    /**
     * Syncs products from CJ Dropshipping, iterating page by page (100 per page).
     * Waits 10 seconds between each page call and logs progress to the console.
     * Can be cancelled at any time by calling cancelSync().
     */
    async syncProducts(): Promise<{ created: number; updated: number; total: number }> {
        // If already syncing, cancel first
        if (this.syncAbortController) {
            this.cancelSync();
            return { created: 0, updated: 0, total: 0 };
        }

        const abortCtrl = new AbortController();
        this.syncAbortController = abortCtrl;

        const PAGE_SIZE = 100;
        const DELAY_MS = 10_000;

        let totalCreated = 0;
        let totalUpdated = 0;
        let page = 1;
        let cancelled = false;

        console.log(
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

                console.log(
                    `%c[CJ Sync] Página ${page} → productos ${rangeStart}–${rangeEnd}…`,
                    "color: #0891b2",
                );

                const res = await fetch(
                    `${BASE_URL}/sync/page?page=${page}&size=${PAGE_SIZE}`,
                    { method: "POST", headers: { accept: "*/*" }, signal: abortCtrl.signal },
                );

                if (!res.ok) {
                    let errorMsg = `HTTP ${res.status}`;
                    try {
                        const errBody: ApiErrorBody = await res.json();
                        errorMsg = errBody.message || errorMsg;
                    } catch {
                        /* response body was not JSON */
                    }
                    throw new ApiError(res.status, errorMsg);
                }

                const result = (await res.json()) as {
                    created: number;
                    updated: number;
                    total: number;
                    page: number;
                    hasMore: boolean;
                };

                totalCreated += result.created;
                totalUpdated += result.updated;

                console.log(
                    `%c[CJ Sync] Página ${page} completada: ` +
                    `+${result.created} creados, ~${result.updated} actualizados ` +
                    `(acumulado: ${totalCreated} creados, ${totalUpdated} actualizados)`,
                    "color: #16a34a",
                );

                if (!result.hasMore) {
                    console.log(
                        "%c[CJ Sync] ✓ Sincronización finalizada. " +
                        `Total: ${totalCreated} creados, ${totalUpdated} actualizados ` +
                        `(${totalCreated + totalUpdated} procesados)`,
                        "color: #2563eb; font-weight: bold",
                    );
                    break;
                }

                // Wait 10 seconds before next page — also abortable
                console.log(
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
            console.log(
                "%c[CJ Sync] ⏹ Detenida. " +
                `Parcial: ${totalCreated} creados, ${totalUpdated} actualizados ` +
                `(${totalCreated + totalUpdated} procesados hasta página ${page})`,
                "color: #f59e0b; font-weight: bold",
            );
        }

        return { created: totalCreated, updated: totalUpdated, total: totalCreated + totalUpdated };
    }
}

export const nexaProductAdminRepository = new NexaProductAdminRepository();
