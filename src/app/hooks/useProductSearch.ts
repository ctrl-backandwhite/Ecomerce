import { useState, useEffect, useCallback, useRef } from "react";
import {
    searchRepository,
    type ProductSearchResponse,
    type ProductSearchHit,
    type SearchParams,
} from "../repositories/SearchRepository";

export interface SearchFilters {
    categoryId?: string[];
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
}

export function useProductSearch(query: string, filters: SearchFilters = {}, size = 24) {
    const [results, setResults] = useState<ProductSearchHit[]>([]);
    const [totalHits, setTotalHits] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const filtersKey = JSON.stringify(filters);

    const doSearch = useCallback(async (pageNum: number, append: boolean) => {
        if (!query || query.trim().length < 2) {
            if (!append) {
                setResults([]);
                setTotalHits(0);
                setHasMore(false);
            }
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
            const params: SearchParams = {
                q: query.trim(),
                page: pageNum,
                size,
                ...filters,
            };
            const response: ProductSearchResponse = await searchRepository.search(params, controller.signal);

            if (append) {
                setResults(prev => [...prev, ...response.results]);
            } else {
                setResults(response.results);
            }
            setTotalHits(response.totalHits);
            setPage(pageNum);
            setHasMore((pageNum + 1) * size < response.totalHits);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filtersKey, size]);

    // Debounced search on query/filters change
    useEffect(() => {
        const timer = setTimeout(() => doSearch(0, false), 300);
        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [doSearch]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            doSearch(page + 1, true);
        }
    }, [loading, hasMore, page, doSearch]);

    return { results, totalHits, loading, hasMore, loadMore };
}
