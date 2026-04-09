import { useMemo } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRanges, type PriceRange } from "../config/priceRanges";

/**
 * Returns price-range filter options converted to the user's active currency.
 * Falls back to USD ranges while the currency is still loading.
 */
export function usePriceRanges(): PriceRange[] {
    const { currency } = useCurrency();
    return useMemo(
        () => getPriceRanges(currency?.rate ?? 1, currency?.currencySymbol ?? "$"),
        [currency],
    );
}
