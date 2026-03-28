/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  useNexaProducts — React hook for fetching products from     ║
 * ║  the NX036 mic-productcategory microservice.                  ║
 * ║                                                              ║
 * ║  Supports:                                                   ║
 * ║  • Optional categoryId filter                                ║
 * ║  • Infinite scroll (accumulates pages)                       ║
 * ║  • Auto locale mapping (pt → pt-BR)                          ║
 * ║  • Re-fetches when locale or categoryId changes              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
    nexaProductRepository,
} from "../repositories/NexaProductRepository";
import {
    mapNexaProducts,
} from "../mappers/NexaProductMapper";
import { nexaCategoryRepository, type NexaCategory } from "../repositories/NexaCategoryRepository";
import { useLanguage } from "../context/LanguageContext";
import type { Product } from "../data/products";

const PAGE_SIZE = 24;

/* ── Module-level cache ─────────────────────────────────────────
 * Keeps products across Home mount/unmount so pressing «back»
 * from ProductDetail restores the exact list the user was seeing.
 * Key = `${categoryId ?? "ALL"}|${locale}` */
interface CacheEntry {
    products: Product[];
    totalElements: number;
    currentPage: number;
    hasMore: boolean;
    categoryMap: Record<string, string>;
    timestamp: number;
}
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60_000; // 5 minutes
function cacheKey(categoryId?: string, locale?: string) {
    return `${categoryId ?? "ALL"}|${locale ?? "en"}`;
}

/** Flatten a NexaCategory tree into a Record<id, name>. */
function buildCategoryMap(cats: NexaCategory[], map: Record<string, string> = {}): Record<string, string> {
    for (const c of cats) {
        map[c.id] = c.name;
        if (c.subCategories?.length) buildCategoryMap(c.subCategories, map);
    }
    return map;
}

export interface UseNexaProductsResult {
    /** Accumulated products across all loaded pages. */
    products: Product[];
    /** True while the initial page (page 0) is loading. */
    loading: boolean;
    /** True while a subsequent page is being appended. */
    loadingMore: boolean;
    /** Error message from the last failed request, or null. */
    error: string | null;
    /** Total number of products matching the current filter. */
    totalElements: number;
    /** Whether more pages are available beyond what's loaded. */
    hasMore: boolean;
    /** Current data source indicator. */
    dataSource: "api" | "mock" | "loading";
    /** Load the next page of products (for infinite scroll). */
    loadMore: () => Promise<void>;
    /** Re-fetch from page 0 (clears accumulated products). */
    refetch: () => void;
}

export function useNexaProducts(categoryId?: string): UseNexaProductsResult {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    // ── Try to restore from cache on mount ─────────────────────────────────
    const ck = cacheKey(categoryId, apiLocale);
    const cached = _cache.get(ck);
    const cacheValid = cached && Date.now() - cached.timestamp < CACHE_TTL;

    const [products, setProducts] = useState<Product[]>(cacheValid ? cached.products : []);
    const [loading, setLoading] = useState(!cacheValid);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalElements, setTotalElements] = useState(cacheValid ? cached.totalElements : 0);
    const [hasMore, setHasMore] = useState(cacheValid ? cached.hasMore : false);
    const [dataSource, setDataSource] = useState<"api" | "mock" | "loading">(cacheValid ? "api" : "loading");

    const currentPage = useRef(cacheValid ? cached.currentPage : 0);
    const abortRef = useRef<AbortController | null>(null);
    const loadMoreAbortRef = useRef<AbortController | null>(null);
    const categoryMapRef = useRef<Record<string, string>>(cacheValid ? cached.categoryMap : {});
    /** Mirror of `products` state kept synchronously for cache writes. */
    const productsRef = useRef<Product[]>(cacheValid ? cached.products : []);

    // ── Fetch a specific page ──────────────────────────────────────────────────
    const fetchPage = useCallback(
        async (page: number, append: boolean, signal?: AbortSignal) => {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setError(null);
                setDataSource("loading");
            }

            try {
                console.log('[useNexaProducts] fetchPage:', { page, append, categoryId, apiLocale });
                const result = await nexaProductRepository.findMany(
                    {
                        locale: apiLocale,
                        categoryId: categoryId || undefined,
                        page,
                        size: PAGE_SIZE,
                    },
                    signal,
                );
                console.log('[useNexaProducts] response:', { totalElements: result.totalElements, contentLength: result.content.length });

                // If aborted after fetch but before setState, bail out
                if (signal?.aborted) return;

                // Fetch category map lazily (once)
                if (Object.keys(categoryMapRef.current).length === 0) {
                    try {
                        const cats = await nexaCategoryRepository.findAll(apiLocale);
                        categoryMapRef.current = buildCategoryMap(cats);
                    } catch { /* ignore — will fallback to categoryId */ }
                }

                const mapped = mapNexaProducts(result.content, categoryMapRef.current);
                const nextHasMore = page < result.totalPages - 1;

                let updatedProducts: Product[];
                if (append) {
                    updatedProducts = [...productsRef.current, ...mapped];
                } else {
                    updatedProducts = mapped;
                }
                productsRef.current = updatedProducts;
                setProducts(updatedProducts);

                setTotalElements(result.totalElements);
                setHasMore(nextHasMore);
                currentPage.current = page;
                setDataSource("api");

                // ── Update module-level cache ───────────────────────
                _cache.set(cacheKey(categoryId, apiLocale), {
                    products: updatedProducts,
                    totalElements: result.totalElements,
                    currentPage: page,
                    hasMore: nextHasMore,
                    categoryMap: { ...categoryMapRef.current },
                    timestamp: Date.now(),
                });
            } catch (err) {
                // Ignore aborted requests — they are intentional cancellations
                if (err instanceof DOMException && err.name === "AbortError") return;
                if (signal?.aborted) return;

                const msg =
                    err instanceof Error ? err.message : "Error al cargar productos";
                setError(msg);
                if (!append) {
                    setProducts([]);
                    setDataSource("mock");
                }
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [apiLocale, categoryId],
    );

    // ── Initial fetch + re-fetch on locale/category change ────────────────────
    const skipInitialFetch = useRef(cacheValid);
    useEffect(() => {
        // If cache was valid on mount, skip the first fetch
        if (skipInitialFetch.current) {
            skipInitialFetch.current = false;
            return;
        }

        // Cancel any in-flight request before starting a new one
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        currentPage.current = 0;
        fetchPage(0, false, controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchPage]);

    // ── Load next page (infinite scroll) ──────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || loading) return;

        loadMoreAbortRef.current?.abort();
        const controller = new AbortController();
        loadMoreAbortRef.current = controller;

        await fetchPage(currentPage.current + 1, true, controller.signal);
    }, [hasMore, loadingMore, loading, fetchPage]);

    // ── Manual refetch ─────────────────────────────────────────────────────────
    const refetch = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        currentPage.current = 0;
        fetchPage(0, false, controller.signal);
    }, [fetchPage]);

    return {
        products,
        loading,
        loadingMore,
        error,
        totalElements,
        hasMore,
        dataSource,
        loadMore,
        refetch,
    };
}
