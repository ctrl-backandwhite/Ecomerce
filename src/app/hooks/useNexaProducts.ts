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
import { nexaCategoryRepository } from "../repositories/NexaCategoryRepository";
import { useLanguage } from "../context/LanguageContext";
import { useCurrency } from "../context/CurrencyContext";
import { buildCategoryMap } from "../lib/categoryUtils";
import type { Product } from "../types/product";

import { logger } from "../lib/logger";

const PAGE_SIZE = 25;

/* ── Module-level cache ─────────────────────────────────────────
 * Keeps products across Home mount/unmount so pressing «back»
 * from ProductDetail restores the exact list the user was seeing.
 * Key = `${categoryId ?? "ALL"}|${locale}|${currencyCode}` */
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
function cacheKey(categoryId?: string, locale?: string, currencyCode?: string) {
    return `${categoryId ?? "ALL"}|${locale ?? "en"}|${currencyCode ?? "USD"}`;
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

export interface UseNexaProductsOptions {
    categoryId?: string;
    name?: string;
    sortBy?: string;
    ascending?: boolean;
}

export function useNexaProducts(optsOrCategoryId?: string | UseNexaProductsOptions): UseNexaProductsResult {
    const opts: UseNexaProductsOptions = typeof optsOrCategoryId === "string"
        ? { categoryId: optsOrCategoryId }
        : optsOrCategoryId ?? {};
    const { categoryId, name, sortBy, ascending } = opts;

    const { locale } = useLanguage();
    const { currency } = useCurrency();
    const currencyCode = currency?.currencyCode ?? "USD";
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    // ── Try to restore from cache on mount ─────────────────────────────────
    const ck = cacheKey(categoryId, apiLocale, currencyCode);
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
    /** Random sort is only honoured on the very first fetch of this mount
     *  (i.e. a real page reload). Any subsequent fetch — loadMore, currency
     *  swap, category change — uses a deterministic createdAt order so the
     *  buyer doesn't lose the shelf they were already browsing. A full page
     *  reload (F5) remounts the hook and flips this back to false, so each
     *  fresh visit still sees a new shuffled slice. */
    const randomInitialDoneRef = useRef(cacheValid);

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
                logger.debug('[useNexaProducts] fetchPage:', { page, append, categoryId, apiLocale });
                // Random only applies to the very first fetch of this mount
                // (real page reload). Any subsequent fetch — loadMore, currency
                // swap, category change — is deterministic createdAt so the
                // buyer keeps their position on the shelf and the scroll batch
                // follows PAGE_SIZE (25) instead of the 2x random sample.
                const wantsRandom = sortBy === "random";
                const isRandomInitial = wantsRandom && !append && !randomInitialDoneRef.current;
                const effectiveSortBy = (wantsRandom && !isRandomInitial) ? "createdAt" : sortBy;
                const result = await nexaProductRepository.findMany(
                    {
                        locale: apiLocale,
                        categoryId: categoryId || undefined,
                        name: name || undefined,
                        sortBy: effectiveSortBy || undefined,
                        ascending,
                        page,
                        size: PAGE_SIZE,
                    },
                    signal,
                );
                logger.debug('[useNexaProducts] response:', { totalElements: result.totalElements, contentLength: result.content.length });

                // If aborted after fetch but before setState, bail out
                if (signal?.aborted) return;

                // Fetch category map lazily (once)
                if (Object.keys(categoryMapRef.current).length === 0) {
                    try {
                        const cats = await nexaCategoryRepository.findAll(apiLocale);
                        categoryMapRef.current = buildCategoryMap(cats);
                    } catch (err) { logger.warn("Suppressed error", err); }
                }

                let mapped = mapNexaProducts(result.content, categoryMapRef.current);
                // When appending onto a random initial page, drop ids already
                // in state so the random sample and the sequential pages don't
                // overlap visibly.
                if (append && productsRef.current.length > 0) {
                    const seen = new Set(productsRef.current.map((p) => p.id));
                    mapped = mapped.filter((p) => !seen.has(p.id));
                }

                let updatedProducts: Product[];
                if (append) {
                    updatedProducts = [...productsRef.current, ...mapped];
                } else {
                    updatedProducts = mapped;
                }
                const nextHasMore = updatedProducts.length < result.totalElements;
                productsRef.current = updatedProducts;
                setProducts(updatedProducts);

                setTotalElements(result.totalElements);
                setHasMore(nextHasMore);
                currentPage.current = page;
                setDataSource("api");
                // First fetch of this mount is done — freeze random so any
                // later non-appending fetch (currency swap, re-render) stays
                // on createdAt until a full page reload remounts the hook.
                randomInitialDoneRef.current = true;

                // ── Update module-level cache ───────────────────────
                // Read currency from the same source `authFetch` used (localStorage)
                // instead of the closure: a `currency:changed` event can fire its
                // listener inside the same React batch where `currencyCode` (from
                // useState) is still the previous value. Closure-based key writes
                // would tag fresh-currency data under the previous-currency key —
                // poisoning future cache reads on the other currency.
                const writeCurrency = (typeof window !== "undefined"
                    ? localStorage.getItem("nexa-currency")
                    : null) || currencyCode;
                _cache.set(cacheKey(categoryId, apiLocale, writeCurrency), {
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
                }
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [apiLocale, categoryId, name, sortBy, ascending, currencyCode],
    );

    // ── Initial fetch + re-fetch on locale/category change ────────────────────
    // We only refetch from page 0 when the cache key actually changes (locale,
    // category or currency). Re-renders that leave those invariant — re-running
    // an identity-shifted useCallback included — must NOT wipe the accumulated
    // loadMore pages, otherwise the buyer loses their scroll position and the
    // shelf reshuffles mid-browsing.
    const lastFetchedKeyRef = useRef(cacheValid ? ck : "");
    useEffect(() => {
        const currentCk = `${categoryId ?? "ALL"}|${apiLocale ?? "en"}|${currencyCode}`;
        if (lastFetchedKeyRef.current === currentCk) {
            return;
        }
        lastFetchedKeyRef.current = currentCk;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        currentPage.current = 0;
        fetchPage(0, false, controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchPage, categoryId, apiLocale, currencyCode]);

    // ── Refetch when the user switches currency ───────────────────────────────
    // CurrencyContext emits `currency:changed`; hooks that know how to refetch
    // acknowledge with `currency:ack` so the context skips its 500ms reload
    // fallback. Keeps scroll/filters/cart intact on a currency swap.
    useEffect(() => {
        function onCurrencyChanged() {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            currentPage.current = 0;
            fetchPage(0, false, controller.signal);
            window.dispatchEvent(new Event("currency:ack"));
        }
        window.addEventListener("currency:changed", onCurrencyChanged);
        return () => window.removeEventListener("currency:changed", onCurrencyChanged);
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
