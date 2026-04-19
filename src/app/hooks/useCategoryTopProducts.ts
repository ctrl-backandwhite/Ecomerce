/**
 * useCategoryTopProducts — fetches the first N products of each given
 * category in parallel. Used by the homepage category showcase so every
 * tile shows its own real product thumbnails instead of relying on the
 * global catalog page cache.
 */

import { useEffect, useState } from "react";
import { nexaProductRepository } from "../repositories/NexaProductRepository";
import { mapNexaProduct } from "../mappers/NexaProductMapper";
import { useLanguage } from "../context/LanguageContext";
import type { Product } from "../types/product";

interface UseCategoryTopProductsResult {
    map: Record<string, Product[]>;
    loading: boolean;
}

export function useCategoryTopProducts(
    categoryIds: string[],
    limit = 4,
): UseCategoryTopProductsResult {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;
    const key = categoryIds.join("|");
    const [map, setMap] = useState<Record<string, Product[]>>({});
    const [loading, setLoading] = useState(categoryIds.length > 0);

    useEffect(() => {
        if (categoryIds.length === 0) {
            setLoading(false);
            setMap({});
            return;
        }
        let cancelled = false;
        setLoading(true);

        Promise.all(
            categoryIds.map(async (id): Promise<[string, Product[]]> => {
                try {
                    const page = await nexaProductRepository.findMany({
                        locale: apiLocale,
                        categoryId: id,
                        page: 0,
                        size: limit,
                    });
                    const products = (page.content ?? []).map((raw) => mapNexaProduct(raw));
                    return [id, products];
                } catch {
                    return [id, []];
                }
            }),
        ).then((results) => {
            if (cancelled) return;
            const next: Record<string, Product[]> = {};
            results.forEach(([id, products]) => {
                next[id] = products;
            });
            setMap(next);
            setLoading(false);
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, limit, apiLocale]);

    return { map, loading };
}
