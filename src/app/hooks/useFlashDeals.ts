/**
 * useFlashDeals — fetches active FLASH campaigns + real products,
 * matches products against campaign scope and applies discounts.
 *
 * Falls back to products that already have originalPrice > price
 * when no FLASH campaigns are active.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import {
    nexaProductRepository,
    type NexaProduct,
} from "../repositories/NexaProductRepository";
import {
    campaignRepository,
    type Campaign,
} from "../repositories/CmsRepository";
import { mapNexaProducts } from "../mappers/NexaProductMapper";
import {
    nexaCategoryRepository,
    type NexaCategory,
} from "../repositories/NexaCategoryRepository";
import { useLanguage } from "../context/LanguageContext";
import type { Product } from "../types/product";

/* ── Helpers ────────────────────────────────────────────────── */

function buildCategoryMap(
    cats: NexaCategory[],
    map: Record<string, string> = {},
): Record<string, string> {
    for (const c of cats) {
        map[c.id] = c.name;
        if (c.subCategories?.length) buildCategoryMap(c.subCategories, map);
    }
    return map;
}

function campaignMatchesProduct(camp: Campaign, p: NexaProduct): boolean {
    const hasProductFilter =
        camp.appliesToProducts && camp.appliesToProducts.length > 0;
    const hasCategoryFilter =
        camp.appliesToCategories && camp.appliesToCategories.length > 0;

    // No filter → applies to all products
    if (!hasProductFilter && !hasCategoryFilter) return true;
    if (hasProductFilter && camp.appliesToProducts!.includes(p.id)) return true;
    if (hasCategoryFilter && camp.appliesToCategories!.includes(p.categoryId))
        return true;
    return false;
}

/* ── Types ──────────────────────────────────────────────────── */

export interface FlashDeal extends Product {
    pct: number;
    campaignEndDate: string | null;
    campaignBadge: string | null;
}

export interface UseFlashDealsResult {
    deals: FlashDeal[];
    loading: boolean;
    /** Earliest FLASH campaign end date (for the countdown). */
    endDate: Date | null;
}

const CACHE_TTL = 3 * 60_000; // 3 min
let _cachedDeals: { deals: FlashDeal[]; endDate: Date | null; ts: number } | null = null;

/* ── Hook ───────────────────────────────────────────────────── */

export function useFlashDeals(): UseFlashDealsResult {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    const hasCached = _cachedDeals && Date.now() - _cachedDeals.ts < CACHE_TTL;

    const [rawProducts, setRawProducts] = useState<NexaProduct[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(!hasCached);
    const fetchedRef = useRef(false);

    /* ── Fetch products + campaigns in parallel ── */
    useEffect(() => {
        if (hasCached || fetchedRef.current) return;
        fetchedRef.current = true;
        const controller = new AbortController();

        (async () => {
            setLoading(true);
            try {
                const [productsRes, campaignsRes] = await Promise.all([
                    nexaProductRepository.findMany(
                        { locale: apiLocale, page: 0, size: 100 },
                        controller.signal,
                    ),
                    campaignRepository.findActive(),
                ]);
                if (controller.signal.aborted) return;

                setRawProducts(productsRes.content);
                setCampaigns(
                    campaignsRes.filter((c) => c.type === "FLASH" && c.active),
                );

                try {
                    const cats = await nexaCategoryRepository.findAll(apiLocale);
                    if (!controller.signal.aborted) {
                        setCategoryMap(buildCategoryMap(cats));
                    }
                } catch {
                    /* category names are optional */
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("[useFlashDeals] fetch error:", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiLocale]);

    /* ── Derive deals ── */
    const deals = useMemo<FlashDeal[]>(() => {
        if (hasCached) return _cachedDeals!.deals;
        if (rawProducts.length === 0) return [];

        // ── Campaign-based flash deals ──
        if (campaigns.length > 0) {
            const seen = new Set<string>();
            const result: FlashDeal[] = [];

            for (const camp of campaigns) {
                const matched = rawProducts.filter(
                    (p) => !seen.has(p.id) && campaignMatchesProduct(camp, p),
                );

                for (const raw of matched) {
                    seen.add(raw.id);
                    const [mapped] = mapNexaProducts([raw], categoryMap);
                    if (!mapped) continue;

                    const originalPrice = mapped.price;
                    let discountedPrice: number;

                    if (camp.type === "FIXED") {
                        discountedPrice = Math.max(
                            0,
                            originalPrice - (camp.value ?? 0),
                        );
                    } else {
                        // PERCENTAGE / FLASH → treat value as %
                        discountedPrice =
                            originalPrice * (1 - (camp.value ?? 0) / 100);
                    }
                    discountedPrice =
                        Math.round(discountedPrice * 100) / 100;

                    const pct =
                        originalPrice > 0
                            ? Math.round(
                                ((originalPrice - discountedPrice) /
                                    originalPrice) *
                                100,
                            )
                            : 0;

                    if (pct <= 0) continue;

                    result.push({
                        ...mapped,
                        originalPrice,
                        price: discountedPrice,
                        pct,
                        campaignEndDate: camp.endDate,
                        campaignBadge: camp.badge,
                    });
                }
            }

            return result.sort((a, b) => b.pct - a.pct).slice(0, 8);
        }

        // ── Fallback: products that already have originalPrice > price ──
        const mapped = mapNexaProducts(rawProducts, categoryMap);
        return mapped
            .filter((p) => p.originalPrice && p.originalPrice > p.price)
            .map((p) => ({
                ...p,
                pct: Math.round(
                    ((p.originalPrice! - p.price) / p.originalPrice!) * 100,
                ),
                campaignEndDate: null,
                campaignBadge: null,
            }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 8);
    }, [rawProducts, campaigns, categoryMap, hasCached]);

    /* ── Campaign end date (earliest) ── */
    const endDate = useMemo<Date | null>(() => {
        if (hasCached) return _cachedDeals!.endDate;
        if (campaigns.length === 0) return null;
        const dates = campaigns
            .map((c) => c.endDate)
            .filter(Boolean)
            .map((d) => new Date(d))
            .filter((d) => d.getTime() > Date.now())
            .sort((a, b) => a.getTime() - b.getTime());
        return dates[0] ?? null;
    }, [campaigns, hasCached]);

    /* ── Persist to module cache ── */
    useEffect(() => {
        if (!loading && deals.length > 0) {
            _cachedDeals = { deals, endDate, ts: Date.now() };
        }
    }, [loading, deals, endDate]);

    return { deals, loading, endDate };
}
