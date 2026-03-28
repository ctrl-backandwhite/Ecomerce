/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaCategoryRepository                                      ║
 * ║                                                              ║
 * ║  Fetches categories from the NX036 mic-productcategory API.  ║
 * ║  Endpoint: /api/v1/categories                                ║
 * ║  Supports locale, status, and active query params.           ║
 * ║  Uses TTLCache for 10 minutes by locale key.                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { TTLCache } from "../lib/cache";
import { ApiError, NetworkError } from "../lib/AppError";

// ── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:6001";
const NX036_CATEGORIES_BASE = `${API_BASE}/api/v1/categories`;

const CACHE_TTL_MS = 10 * 60_000; // 10 minutes

// ── API response types ───────────────────────────────────────────────────────

export interface CategoryTranslation {
    locale: string;
    name: string;
}

export interface NexaCategory {
    id: string;
    parentId: string | null;
    name: string;
    level: number;
    status: string;
    active: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string | null;
    translations: CategoryTranslation[];
    subCategories: NexaCategory[];
}

export interface NexaCategoryError {
    code: string;
    message: string;
    details: string[];
    timeStamp: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class NexaCategoryRepository {
    private readonly cache = new TTLCache<NexaCategory[]>();

    /**
     * Fetches all published & active categories for the given locale.
     * Results are cached per locale for CACHE_TTL_MS.
     */
    async findAll(locale: string): Promise<NexaCategory[]> {
        const cacheKey = `categories_${locale}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const url = `${NX036_CATEGORIES_BASE}?locale=${encodeURIComponent(locale)}&status=PUBLISHED&active=true`;
            const res = await fetch(url);

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: NexaCategoryError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            const data: NexaCategory[] = await res.json();
            this.cache.set(cacheKey, data, CACHE_TTL_MS);
            return data;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de categorías",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Fetches only the featured (principal) categories for the given locale.
     * Results are cached per locale for CACHE_TTL_MS.
     */
    async findFeatured(locale: string): Promise<NexaCategory[]> {
        const cacheKey = `featured_${locale}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const url = `${NX036_CATEGORIES_BASE}/featured?locale=${encodeURIComponent(locale)}`;
            const res = await fetch(url);

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: NexaCategoryError = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            const data: NexaCategory[] = await res.json();
            this.cache.set(cacheKey, data, CACHE_TTL_MS);
            return data;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de categorías destacadas",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /** Clears the cache for a specific locale (or all). */
    invalidate(locale?: string): void {
        if (locale) {
            this.cache.delete(`categories_${locale}`);
            this.cache.delete(`featured_${locale}`);
        } else {
            this.cache.clear();
        }
    }
}

// Singleton
export const nexaCategoryRepository = new NexaCategoryRepository();
