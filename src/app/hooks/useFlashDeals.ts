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
} from "../repositories/CampaignRepository";
import { mapNexaProducts } from "../mappers/NexaProductMapper";
import {
    nexaCategoryRepository,
} from "../repositories/NexaCategoryRepository";
import { useLanguage } from "../context/LanguageContext";
import { useCurrency } from "../context/CurrencyContext";
import { buildCategoryMap } from "../lib/categoryUtils";
import type { Product } from "../types/product";

import { logger } from "../lib/logger";

/* ── Helpers ────────────────────────────────────────────────── */

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
    /** Top 8 deals for the carousel. */
    deals: FlashDeal[];
    /** ALL campaign deals (no limit). */
    allDeals: FlashDeal[];
    loading: boolean;
    /** Earliest FLASH campaign end date (for the countdown). */
    endDate: Date | null;
}

const CACHE_TTL = 3 * 60_000; // 3 min
let _cachedDeals: { deals: FlashDeal[]; allDeals: FlashDeal[]; endDate: Date | null; ts: number; currencyCode: string } | null = null;

/* ── Hook ───────────────────────────────────────────────────── */

export function useFlashDeals(): UseFlashDealsResult {
    const { locale } = useLanguage();
    const { currency } = useCurrency();
    const currencyCode = currency?.currencyCode ?? "USD";
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    const hasCached = _cachedDeals
        && _cachedDeals.currencyCode === currencyCode
        && Date.now() - _cachedDeals.ts < CACHE_TTL;

    const [rawProducts, setRawProducts] = useState<NexaProduct[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(!hasCached);
    const fetchedRef = useRef(false);

    // Reset fetchedRef when currency changes so we re-fetch
    const prevCurrencyRef = useRef(currencyCode);
    if (prevCurrencyRef.current !== currencyCode) {
        prevCurrencyRef.current = currencyCode;
        fetchedRef.current = false;
        _cachedDeals = null;
    }

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
                } catch (err) { logger.warn("Suppressed error", err); }
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("[useFlashDeals] fetch error:", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiLocale, currencyCode]);

    /* ── Derive all deals ── */
    const allDeals = useMemo<FlashDeal[]>(() => {
        if (hasCached) return _cachedDeals!.allDeals;
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
                    const cost = mapped.costPrice ?? 0;
                    const margin = Math.max(0, originalPrice - cost);
                    let discountedPrice: number;

                    if (camp.type === "FIXED") {
                        // Fixed discount capped at margin (never below cost)
                        const fixedOff = Math.min(camp.value ?? 0, margin);
                        discountedPrice = originalPrice - fixedOff;
                    } else {
                        // PERCENTAGE / FLASH → apply % only to the margin
                        discountedPrice =
                            cost + margin * (1 - (camp.value ?? 0) / 100);
                    }
                    // Ensure price never drops below cost
                    discountedPrice = Math.max(cost, discountedPrice);
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

            return result.sort((a, b) => b.pct - a.pct);
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
            .sort((a, b) => b.pct - a.pct);
    }, [rawProducts, campaigns, categoryMap, hasCached]);

    /** Top 8 for the carousel */
    const deals = useMemo(() => allDeals.slice(0, 8), [allDeals]);

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
        if (!loading && allDeals.length > 0) {
            _cachedDeals = { deals, allDeals, endDate, ts: Date.now(), currencyCode };
        }
    }, [loading, deals, allDeals, endDate, currencyCode]);

    return { deals, allDeals, loading, endDate };
}
