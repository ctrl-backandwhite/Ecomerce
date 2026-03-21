/**
 * usePagedCategories — React hook for fetching paginated categories
 * from the NEXA mic-productcategory microservice.
 *
 * Supports all filter params: locale, status, active, name, level,
 * page, size, sortBy, ascending.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    nexaCategoryPagedRepository,
    type CategoryPage,
    type CategoryPageQuery,
    type PagedCategory,
} from "../repositories/NexaCategoryPagedRepository";
import { useLanguage } from "../context/LanguageContext";

export interface UsePagedCategoriesResult {
    /** Current page of categories */
    categories: PagedCategory[];
    /** Whether a request is in-flight */
    loading: boolean;
    /** Error message, if any */
    error: string | null;
    /** Current 0-based page index */
    page: number;
    /** Page size */
    size: number;
    /** Total number of elements across all pages */
    totalElements: number;
    /** Total number of pages */
    totalPages: number;
    /** Change page (0-based) */
    setPage: (p: number) => void;
    /** Force refetch with current params */
    refetch: () => void;
}

export function usePagedCategories(
    query: CategoryPageQuery = {},
): UsePagedCategoriesResult {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    // Internal page override — resets to 0 when query changes
    const [pageOverride, setPageOverride] = useState<number | null>(null);

    // Serialize query (without page) to detect real filter changes
    const queryKey = useMemo(() => {
        const { page: _p, ...rest } = query;
        return JSON.stringify(rest);
    }, [query]);

    // Reset page override when filters change
    useEffect(() => {
        setPageOverride(null);
    }, [queryKey]);

    // Merge query with page override
    const effectiveQuery = useMemo<CategoryPageQuery>(() => ({
        page: 0,
        size: 20,
        ascending: true,
        ...query,
        ...(pageOverride !== null ? { page: pageOverride } : {}),
    }), [query, pageOverride]);

    const [data, setData] = useState<CategoryPage>({
        content: [],
        currentPage: 0,
        pageSize: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track the latest request id to avoid race conditions
    const requestId = useRef(0);

    const fetchData = useCallback(async (q: CategoryPageQuery, currentLocale: string) => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            const result = await nexaCategoryPagedRepository.findPaged({
                ...q,
                locale: currentLocale,
            });

            // Only update state if this is still the latest request
            if (id === requestId.current) {
                setData(result);
            }
        } catch (err) {
            if (id === requestId.current) {
                const msg = err instanceof Error ? err.message : "Error al cargar categorías";
                setError(msg);
                setData(prev => ({ ...prev, content: [] }));
            }
        } finally {
            if (id === requestId.current) {
                setLoading(false);
            }
        }
    }, []);

    // Refetch whenever the effective query or locale change
    useEffect(() => {
        fetchData(effectiveQuery, apiLocale);
    }, [effectiveQuery, apiLocale, fetchData]);

    const setPage = useCallback((p: number) => {
        setPageOverride(p);
    }, []);

    const refetch = useCallback(() => {
        fetchData(effectiveQuery, apiLocale);
    }, [fetchData, effectiveQuery, apiLocale]);

    return {
        categories: data.content,
        loading,
        error,
        page: data.currentPage,
        size: data.pageSize,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        setPage,
        refetch,
    };
}
