/** Price range definition for sidebar / mobile drawer filters. */
export interface PriceRange {
    label: string;
    min: number;
    max: number;
}

/** Base USD thresholds (min/max in cents-agnostic whole numbers). */
const BASE_USD = [
    { min: 0, max: Infinity },
    { min: 0, max: 50 },
    { min: 50, max: 150 },
    { min: 150, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: Infinity },
] as const;

/** Compact number formatter (no decimals). */
const fmt = (n: number) =>
    n >= 10_000 ? n.toLocaleString("es", { maximumFractionDigits: 0 }) : String(n);

/**
 * Build price-range filter options converted to the given currency.
 * @param rate  Exchange rate vs USD (1 for USD).
 * @param symbol  Currency symbol (e.g. "$", "€", "R$").
 */
export function getPriceRanges(rate = 1, symbol = "$"): PriceRange[] {
    return BASE_USD.map(({ min, max }) => {
        const cMin = Math.round(min * rate);
        const cMax = max === Infinity ? Infinity : Math.round(max * rate);

        if (min === 0 && max === Infinity)
            return { label: "Todos", min: 0, max: Infinity };
        if (min === 0)
            return { label: `Hasta ${symbol}${fmt(cMax)}`, min: 0, max: cMax };
        if (max === Infinity)
            return { label: `Más de ${symbol}${fmt(cMin)}`, min: cMin, max: Infinity };
        return { label: `${symbol}${fmt(cMin)} – ${symbol}${fmt(cMax)}`, min: cMin, max: cMax };
    });
}

/** @deprecated Use `usePriceRanges()` hook or `getPriceRanges()` for dynamic ranges. */
export const priceRanges = getPriceRanges();
