/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaVariantAdminRepository                                  ║
 * ║                                                              ║
 * ║  CRUD operations for product-detail variants against NX036    ║
 * ║  mic-productcategory API:                                    ║
 * ║    GET    /api/v1/products/detail/variants        (paged)    ║
 * ║    GET    /api/v1/products/detail/:pid/variants   (list)     ║
 * ║    GET    /api/v1/products/detail/variants/:vid   (get one)  ║
 * ║    POST   /api/v1/products/detail/variants        (create)   ║
 * ║    PUT    /api/v1/products/detail/variants/:vid   (update)   ║
 * ║    DELETE /api/v1/products/detail/variants/:vid   (delete)   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { ApiError, NetworkError } from "../lib/AppError";
import type {
    ProductVariant,
    VariantTranslation,
    VariantInventory,
    BulkImportResult,
} from "./NexaProductAdminRepository";

// Re-export types for convenience
export type { ProductVariant, VariantTranslation, VariantInventory, BulkImportResult };

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:6001";
const BASE_URL = `${API_BASE}/api/v1/products`;

// ── Payload types ────────────────────────────────────────────────────────────

export interface VariantTranslationPayload {
    locale: string;
    variantName: string | null;
}

export interface VariantInventoryPayload {
    id?: number | null;
    countryCode: string;
    totalInventory: number;
    cjInventory: number;
    factoryInventory: number;
    verifiedWarehouse: number;
}

export interface VariantPayload {
    pid: string;
    variantNameEn?: string;
    variantSku?: string;
    variantUnit?: string;
    variantKey?: string;
    variantImage?: string;
    variantLength?: number | null;
    variantWidth?: number | null;
    variantHeight?: number | null;
    variantVolume?: number | null;
    variantWeight?: number | null;
    variantSellPrice?: number | null;
    variantSugSellPrice?: number | null;
    variantStandard?: string | null;
    translations?: VariantTranslationPayload[];
    inventories?: VariantInventoryPayload[];
}

interface ApiErrorBody {
    code: string;
    message: string;
    details: string[];
    timeStamp: string;
}

// ── Paged response type ──────────────────────────────────────────────────────

export interface PagedVariantResponse {
    content: ProductVariant[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// ── Repository class ─────────────────────────────────────────────────────────

class NexaVariantAdminRepository {
    /**
     * List all variants paginated, with optional filters.
     */
    async findAllPaged(
        page = 0,
        size = 20,
        search?: string,
        status?: "DRAFT" | "PUBLISHED" | "",
        sortBy?: string,
        ascending?: boolean,
        locale: string = "en",
    ): Promise<PagedVariantResponse> {
        try {
            let url = `${BASE_URL}/detail/variants?page=${page}&size=${size}&locale=${encodeURIComponent(locale)}`;
            if (search && search.trim()) {
                url += `&search=${encodeURIComponent(search.trim())}`;
            }
            if (status) {
                url += `&status=${status}`;
            }
            if (sortBy) {
                url += `&sortBy=${encodeURIComponent(sortBy)}`;
            }
            if (ascending !== undefined) {
                url += `&ascending=${ascending}`;
            }
            const res = await fetch(url);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as PagedVariantResponse;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * List all variants of a product by pid.
     */
    async findByPid(pid: string, locale: string = "en"): Promise<ProductVariant[]> {
        try {
            const res = await fetch(`${BASE_URL}/detail/${pid}/variants?locale=${encodeURIComponent(locale)}`);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as ProductVariant[];
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Get a single variant by vid.
     */
    async findByVid(vid: string, locale: string = "en"): Promise<ProductVariant> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/${vid}?locale=${encodeURIComponent(locale)}`);
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* ignore parse error */ }
                throw new ApiError(res.status, errorMsg);
            }
            return (await res.json()) as ProductVariant;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Create a new variant.
     */
    async createVariant(data: VariantPayload): Promise<ProductVariant> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants`, {
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
            return (await res.json()) as ProductVariant;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Update an existing variant.
     */
    async updateVariant(vid: string, data: VariantPayload): Promise<ProductVariant> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/${vid}`, {
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
            return (await res.json()) as ProductVariant;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Delete a variant by vid.
     */
    async deleteVariant(vid: string): Promise<void> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/${vid}`, { method: "DELETE" });
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
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Toggle variant publish status (DRAFT ↔ PUBLISHED).
     */
    async togglePublish(vid: string): Promise<void> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/${vid}/publish`, { method: "PATCH" });
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
                "No se pudo cambiar el estado de la variante",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk create variants from a JSON array.
     */
    async bulkCreate(rows: VariantPayload[]): Promise<BulkImportResult> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/bulk`, {
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
                "No se pudo conectar con el servicio de variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Delete multiple variants by VIDs.
     */
    async deleteVariants(vids: string[]): Promise<void> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vids),
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
                "No se pudo eliminar las variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk update variant status (DRAFT / PUBLISHED).
     */
    async bulkUpdateStatus(vids: string[], status: "DRAFT" | "PUBLISHED"): Promise<void> {
        try {
            const res = await fetch(`${BASE_URL}/detail/variants/bulk-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: vids, status }),
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
                "No se pudo cambiar el estado de las variantes",
                err instanceof Error ? err : undefined,
            );
        }
    }
}

export const nexaVariantAdminRepository = new NexaVariantAdminRepository();
