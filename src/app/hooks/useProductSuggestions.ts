/**
 * useProductSuggestions — content-based recommendations from the user's
 * browsing history stored by RecentlyViewedContext.
 *
 * Strategy (cheap and explainable):
 *   1. Look at the last N products the user opened (RecentlyViewedContext
 *      already keeps up to 8 in localStorage).
 *   2. Count how many times each categoryId shows up; keep the top K
 *      categories ordered by frequency.
 *   3. Fetch a random sample per category in parallel.
 *   4. Interleave the results in round-robin order (one from cat1, one from
 *      cat2, one from cat3, …, then back to cat1) so the rail never shows
 *      only one type of product. The most-viewed category still starts the
 *      rotation.
 *   5. Drop anything the user already viewed.
 *
 * Stays 100% on the frontend — no new backend tables, no server-side
 * recommendation job. The backend sees only plain product-by-category
 * queries, exactly what the catalogue already serves.
 */

import { useEffect, useState } from "react";
import { nexaProductRepository } from "../repositories/NexaProductRepository";
import { mapNexaProduct } from "../mappers/NexaProductMapper";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { useLanguage } from "../context/LanguageContext";
import { logger } from "../lib/logger";
import type { Product } from "../types/product";

interface UseProductSuggestionsResult {
    suggestions: Product[];
    loading: boolean;
    /** Categories that drove the suggestions — useful for UI subtitles. */
    basedOn: string[];
}

/** How many of the user's top categories to pull from. */
const MAX_TOP_CATEGORIES = 4;

export function useProductSuggestions(limit = 12): UseProductSuggestionsResult {
    const { viewed } = useRecentlyViewed();
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [basedOn, setBasedOn] = useState<string[]>([]);

    // Use the viewed ids as a stable dep string — avoids re-fetching when the
    // array reference changes but the ids stay the same.
    const viewedKey = viewed.map((v) => v.id).join("|");

    useEffect(() => {
        if (viewed.length === 0) {
            setSuggestions([]);
            setBasedOn([]);
            return;
        }

        const catCounts = new Map<string, { count: number; name: string }>();
        for (const p of viewed) {
            if (!p.categoryId) continue;
            const entry = catCounts.get(p.categoryId);
            if (entry) entry.count += 1;
            else catCounts.set(p.categoryId, { count: 1, name: p.category });
        }

        const topCategories = [...catCounts.entries()]
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, MAX_TOP_CATEGORIES);

        if (topCategories.length === 0) {
            setSuggestions([]);
            setBasedOn([]);
            return;
        }

        // Fetch a small buffer per category so round-robin interleaving has
        // room to skip already-viewed products without running out of picks.
        const perCategory = Math.max(3, Math.ceil(limit / topCategories.length) + 2);

        let cancelled = false;
        setLoading(true);
        setBasedOn(topCategories.map(([, v]) => v.name).filter(Boolean));

        Promise.all(
            topCategories.map(([catId]) =>
                nexaProductRepository
                    .findMany({
                        locale: apiLocale,
                        categoryId: catId,
                        size: perCategory,
                        sortBy: "random",
                    })
                    .catch((err) => {
                        logger.warn("[useProductSuggestions] fetch failed", err);
                        return { content: [] } as { content: unknown[] };
                    }),
            ),
        )
            .then((results) => {
                if (cancelled) return;
                const buckets: Product[][] = results.map((r) =>
                    (r.content ?? []).map((raw) => mapNexaProduct(raw as never)),
                );
                const seen = new Set(viewed.map((v) => v.id));
                const merged: Product[] = [];
                // Round-robin interleave: pick one from each bucket in turn
                // until we hit the limit or all buckets are empty.
                let exhausted = false;
                while (merged.length < limit && !exhausted) {
                    exhausted = true;
                    for (const bucket of buckets) {
                        while (bucket.length > 0) {
                            const next = bucket.shift()!;
                            if (!seen.has(next.id)) {
                                seen.add(next.id);
                                merged.push(next);
                                exhausted = false;
                                break;
                            }
                        }
                        if (merged.length >= limit) break;
                    }
                }
                setSuggestions(merged);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewedKey, apiLocale, limit]);

    return { suggestions, loading, basedOn };
}
