import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    nexaProductAdminRepository,
    type AdminProduct,
    type AdminProductPage,
    type AdminProductQuery,
} from "../repositories/NexaProductAdminRepository";
import { useLanguage } from "../context/LanguageContext";

export interface UseAdminProductsResult {
    products: AdminProduct[];
    loading: boolean;
    error: string | null;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    setPage: (p: number) => void;
    refetch: () => void;
}

export function useAdminProducts(query: AdminProductQuery = {}): UseAdminProductsResult {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;
    const [pageOverride, setPageOverride] = useState<number | null>(null);

    // Reset page when filters change
    const queryKey = useMemo(() => {
        const { page: _p, ...rest } = query;
        return JSON.stringify(rest);
    }, [query]);

    useEffect(() => {
        setPageOverride(null);
    }, [queryKey]);

    const effectiveQuery = useMemo<AdminProductQuery>(
        () => ({
            page: 0,
            size: 20,
            ascending: false,
            sortBy: "createdAt",
            ...query,
            ...(pageOverride !== null ? { page: pageOverride } : {}),
        }),
        [query, pageOverride],
    );

    const [data, setData] = useState<AdminProductPage>({
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
    const requestId = useRef(0);

    const fetchData = useCallback(
        async (q: AdminProductQuery, currentLocale: string) => {
            const id = ++requestId.current;
            setLoading(true);
            setError(null);
            try {
                const result = await nexaProductAdminRepository.findPaged({
                    ...q,
                    locale: currentLocale,
                });
                if (id === requestId.current) setData(result);
            } catch (err) {
                if (id === requestId.current) {
                    setError(
                        err instanceof Error ? err.message : "Error al cargar productos",
                    );
                    setData((prev) => ({ ...prev, content: [] }));
                }
            } finally {
                if (id === requestId.current) setLoading(false);
            }
        },
        [],
    );

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
        products: data.content,
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
