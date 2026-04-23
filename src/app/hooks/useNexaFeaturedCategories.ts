/**
 * useNexaFeaturedCategories — React hook for fetching only the
 * featured (principal) categories from the NX036 mic-productcategory
 * microservice.
 *
 * Re-fetches automatically when the locale changes (via LanguageContext).
 */

import { useState, useEffect, useCallback } from "react";
import {
    nexaCategoryRepository,
    type NexaCategory,
} from "../repositories/NexaCategoryRepository";
import { useLanguage } from "../context/LanguageContext";

export interface UseNexaFeaturedCategoriesResult {
    categories: NexaCategory[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useNexaFeaturedCategories(): UseNexaFeaturedCategoriesResult {
    const { locale } = useLanguage();
    const [categories, setCategories] = useState<NexaCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiLocale = locale === "pt" ? "pt-BR" : locale;
            const featured = await nexaCategoryRepository.findFeatured(apiLocale);
            if (featured.length > 0) {
                setCategories(featured);
                return;
            }
            // No category is explicitly flagged as featured yet — fall back to all
            // top-level categories so the category bar + per-category sections on
            // the home still render. Once admins mark some as featured this branch
            // is simply skipped.
            const all = await nexaCategoryRepository.findAll(apiLocale);
            setCategories(all.filter((c) => c.level === 1 || c.parentId == null));
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Error al cargar categorías destacadas";
            setError(msg);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [locale]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const refetch = useCallback(() => {
        nexaCategoryRepository.invalidate();
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refetch };
}
