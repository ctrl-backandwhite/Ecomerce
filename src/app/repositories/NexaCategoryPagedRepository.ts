/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaCategoryPagedRepository                                 ║
 * ║                                                              ║
 * ║  Fetches categories from the NEXA mic-productcategory API   ║
 * ║  using the paginated endpoint:                              ║
 * ║    GET /api/v1/categories/paged                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { ApiError, NetworkError } from "../lib/AppError";

// ── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:6001";
const CATEGORIES_URL = `${API_BASE}/api/v1/categories`;
const BASE_URL = `${CATEGORIES_URL}/paged`;

// ── API types ────────────────────────────────────────────────────────────────

export interface CategoryTranslation {
    locale: string;
    name: string;
}

export interface PagedCategory {
    id: string;
    parentId: string | null;
    name: string;
    level: number;
    status: "DRAFT" | "PUBLISHED";
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
    translations: CategoryTranslation[];
    subCategories: string[];
}

export interface CategoryPage {
    content: PagedCategory[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/** Query parameters accepted by the paged endpoint. */
export interface CategoryPageQuery {
    locale?: string;
    status?: "DRAFT" | "PUBLISHED";
    active?: boolean;
    name?: string;
    level?: number;
    page?: number;
    size?: number;
    sortBy?: string;
    ascending?: boolean;
}

export interface CategoryApiError {
    code: string;
    message: string;
    details: string[];
    timeStamp: string;
}

/** Full category detail (recursive) returned by GET /api/v1/categories/{id} */
export interface CategoryDetail {
    id: string;
    parentId: string | null;
    name: string;
    level: number;
    status: "DRAFT" | "PUBLISHED";
    active: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string | null;
    translations: CategoryTranslation[];
    subCategories: CategoryDetail[];
}

// ── Bulk upload types ────────────────────────────────────────────────────────

export interface BulkCategoryRow {
    level1Translations: { locale: string; name: string }[];
    level2Translations?: { locale: string; name: string }[] | null;
    level3Translations?: { locale: string; name: string }[] | null;
}

export interface BulkCategoryResult {
    created: number;
    skipped: number;
    totalRows: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class NexaCategoryPagedRepository {
    /**
     * Fetches a page of categories with optional filters.
     */
    async findPaged(query: CategoryPageQuery = {}): Promise<CategoryPage> {
        try {
            const params = new URLSearchParams();

            if (query.locale) params.set("locale", query.locale);
            if (query.status) params.set("status", query.status);
            if (query.active !== undefined) params.set("active", String(query.active));
            if (query.name) params.set("name", query.name);
            if (query.level !== undefined) params.set("level", String(query.level));
            if (query.page !== undefined) params.set("page", String(query.page));
            if (query.size !== undefined) params.set("size", String(query.size));
            if (query.sortBy) params.set("sortBy", query.sortBy);
            if (query.ascending !== undefined) params.set("ascending", String(query.ascending));

            const url = `${BASE_URL}?${params.toString()}`;
            const res = await fetch(url);

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as CategoryPage;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Toggles the publish status of a category (DRAFT ↔ PUBLISHED).
     */
    async togglePublish(categoryId: string): Promise<void> {
        try {
            const url = `${CATEGORIES_URL}/${categoryId}/publish`;
            const res = await fetch(url, { method: "PATCH", headers: { accept: "*/*" } });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo cambiar el estado de la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Toggles the active flag of a category.
     */
    async toggleActive(categoryId: string, active: boolean): Promise<void> {
        try {
            const url = `${CATEGORIES_URL}/${categoryId}/active?active=${active}`;
            const res = await fetch(url, { method: "PATCH", headers: { accept: "*/*" } });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo cambiar la visibilidad de la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }
    /**
     * Fetches a single category by ID with its full recursive children tree.
     */
    async findById(categoryId: string, locale: string = "en"): Promise<CategoryDetail> {
        try {
            const url = `${CATEGORIES_URL}/${categoryId}?locale=${encodeURIComponent(locale)}`;
            const res = await fetch(url);

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as CategoryDetail;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo obtener el detalle de la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Creates a new category.
     */
    async createCategory(data: {
        parentId?: string | null;
        level: number;
        translations: { locale: string; name: string }[];
    }): Promise<CategoryDetail> {
        try {
            const res = await fetch(CATEGORIES_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", accept: "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as CategoryDetail;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo crear la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Updates an existing category.
     */
    async updateCategory(categoryId: string, data: {
        parentId?: string | null;
        level: number;
        translations: { locale: string; name: string }[];
    }): Promise<CategoryDetail> {
        try {
            const url = `${CATEGORIES_URL}/${categoryId}`;
            const res = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json", accept: "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as CategoryDetail;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo actualizar la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Deletes a category by ID.
     */
    async deleteCategory(categoryId: string): Promise<void> {
        try {
            const url = `${CATEGORIES_URL}/${categoryId}`;
            const res = await fetch(url, { method: "DELETE", headers: { accept: "*/*" } });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo eliminar la categoría",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Syncs categories from CJ Dropshipping.
     */
    async syncCategories(): Promise<{ created: number; updated: number; total: number }> {
        try {
            const url = `${CATEGORIES_URL}/sync`;
            const res = await fetch(url, { method: "POST", headers: { accept: "*/*" }, body: "" });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as { created: number; updated: number; total: number };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo sincronizar las categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk-creates categories with up to 3 hierarchy levels.
     */
    async bulkCreateCategories(rows: BulkCategoryRow[]): Promise<BulkCategoryResult> {
        try {
            const url = `${CATEGORIES_URL}/bulk`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", accept: "application/json" },
                body: JSON.stringify({ rows }),
            });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as BulkCategoryResult;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo realizar la carga masiva de categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Delete multiple categories by IDs.
     */
    async deleteCategories(ids: string[]): Promise<void> {
        try {
            const res = await fetch(CATEGORIES_URL, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ids),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo eliminar las categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Bulk update category status (DRAFT / PUBLISHED).
     */
    async bulkUpdateStatus(ids: string[], status: "DRAFT" | "PUBLISHED"): Promise<void> {
        try {
            const res = await fetch(`${CATEGORIES_URL}/bulk-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids, status }),
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: CategoryApiError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* not JSON */ }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo cambiar el estado de las categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }
}

// Singleton
export const nexaCategoryPagedRepository = new NexaCategoryPagedRepository();
