import { useMemo } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { getPriceRanges, type PriceRange } from "../config/priceRanges";

/**
 * Returns price-range filter options converted to the user's active currency
 * and localised to the active language. Falls back to Spanish + USD if either
 * context is still loading.
 */
export function usePriceRanges(): PriceRange[] {
    const { currency } = useCurrency();
    const { t } = useLanguage();
    return useMemo(
        () => getPriceRanges(currency?.rate ?? 1, currency?.currencySymbol ?? "$", {
            all: t("filters.priceAll") || "Todos",
            upTo: t("filters.priceUpTo") || "Hasta",
            moreThan: t("filters.priceMoreThan") || "Más de",
        }),
        [currency, t],
    );
}
