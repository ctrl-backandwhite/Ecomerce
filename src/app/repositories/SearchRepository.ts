/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SearchRepository                                            ║
 * ║                                                              ║
 * ║  Fetches search results and autocomplete from Elasticsearch  ║
 * ║  via the mic-productcategory search endpoints.               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { nxFetch } from "../lib/nxFetch";
import { API_CATALOG } from "../config/api";
import { ApiError, NetworkError } from "../lib/AppError";

const SEARCH_BASE = `${API_CATALOG}/api/v1/public/search`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductSearchHit {
    id: string;
    pid: string;
    name: string;
    description: string | null;
    categoryName: string | null;
    brandName: string | null;
    price: number | null;
    originalPrice: number | null;
    inStock: boolean;
    totalStock: number;
    imageUrl: string | null;
    status: string;
    highlights: Record<string, string[]>;
}

export interface ProductSearchResponse {
    results: ProductSearchHit[];
    totalHits: number;
    page: number;
    size: number;
}

export interface AutocompleteSuggestion {
    text: string;
    pid: string;
    imageUrl: string | null;
    price: number | null;
}

export interface SearchParams {
    q: string;
    categoryId?: string[];
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    page?: number;
    size?: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class SearchRepository {

    async search(params: SearchParams, signal?: AbortSignal): Promise<ProductSearchResponse> {
        const qs = new URLSearchParams();
        qs.set("q", params.q);
        if (params.categoryId) params.categoryId.forEach(id => qs.append("categoryId", id));
        if (params.brand) qs.set("brand", params.brand);
        if (params.minPrice != null) qs.set("minPrice", String(params.minPrice));
        if (params.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));
        if (params.inStock != null) qs.set("inStock", String(params.inStock));
        if (params.sortBy) qs.set("sortBy", params.sortBy);
        qs.set("page", String(params.page ?? 0));
        qs.set("size", String(params.size ?? 24));

        try {
            const res = await nxFetch(`${SEARCH_BASE}?${qs.toString()}`, { signal });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const b = await res.json(); msg = b.message || msg; } catch { /* ignore */ }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as ProductSearchResponse;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudo buscar productos", err instanceof Error ? err : undefined);
        }
    }

    async autocomplete(q: string, limit = 8, signal?: AbortSignal): Promise<AutocompleteSuggestion[]> {
        if (!q || q.trim().length < 2) return [];

        try {
            const qs = new URLSearchParams({ q, limit: String(limit) });
            const res = await nxFetch(`${SEARCH_BASE}/autocomplete?${qs.toString()}`, { signal });
            if (!res.ok) return [];
            return (await res.json()) as AutocompleteSuggestion[];
        } catch {
            return [];
        }
    }
}

export const searchRepository = new SearchRepository();
