import { useEffect, useRef, useMemo } from "react";
import { taxRepository } from "../../../repositories/TaxRepository";
import { useTimezone } from "../../../context/TimezoneContext";
import { logger } from "../../../lib/logger";
import type { CheckoutState, CheckoutAction } from "../types";
import type { Address } from "../../../context/UserContext";

const LOCALES_FOR_LOOKUP = ["es", "en", "pt", "fr", "de", "it"];

/**
 * Resolve a country display name (e.g. "España", "United States") to its
 * ISO 3166-1 alpha-2 code ("ES", "US").  If the value is already a 2-letter
 * code it is returned as-is.
 */
function resolveCountryCode(
    raw: string,
    knownCodes: string[],
): string {
    const trimmed = raw.trim();
    if (trimmed.length === 2 && /^[A-Z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();

    const lower = trimmed.toLowerCase();

    // Try Intl.DisplayNames reverse lookup across several locales
    for (const locale of LOCALES_FOR_LOOKUP) {
        try {
            const dn = new Intl.DisplayNames([locale], { type: "region" });
            for (const code of knownCodes) {
                if (dn.of(code)?.toLowerCase() === lower) return code;
            }
        } catch { /* locale not supported, skip */ }
    }
    return trimmed; // return as-is (fallback)
}

export function useTaxCalculation(
    subtotal: number,
    selectedAddrId: string,
    selectedAddr: Address | null | undefined,
    manualAddr: CheckoutState["manualAddr"],
    newMode: CheckoutState["newMode"],
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const { selectedCountry, countries } = useTimezone();
    const taxTimer = useRef<ReturnType<typeof setTimeout>>();

    // Fallback country: use the country selected in TimezoneContext
    const fallbackCountry = selectedCountry?.code ?? "US";

    // Pre-compute known ISO codes from the countries list for reverse lookup
    const knownCodes = useMemo(
        () => countries.map((c) => c.code),
        [countries],
    );

    useEffect(() => {
        clearTimeout(taxTimer.current);
        if (subtotal === 0) return;

        // Determine country/state from selected address, fallback to user's selected country
        let country = fallbackCountry;
        let state: string | undefined;
        if (selectedAddr) {
            country = selectedAddr.country
                ? resolveCountryCode(selectedAddr.country, knownCodes)
                : fallbackCountry;
            state = selectedAddr.state ?? undefined;
        } else if (selectedAddrId === "new" && newMode === "home" && manualAddr.country) {
            country = resolveCountryCode(manualAddr.country, knownCodes);
            state = manualAddr.state || undefined;
        }

        taxTimer.current = setTimeout(() => {
            dispatch({ type: "PATCH", payload: { taxLoading: true } });
            taxRepository
                .calculate({ subtotal, country, state })
                .then((tc) => dispatch({ type: "PATCH", payload: { taxCalc: tc } }))
                .catch((err) => {
                    logger.warn("Tax calculation failed", err);
                    dispatch({ type: "PATCH", payload: { taxCalc: null } });
                })
                .finally(() => dispatch({ type: "PATCH", payload: { taxLoading: false } }));
        }, 400); // debounce
        return () => clearTimeout(taxTimer.current);
    }, [subtotal, selectedAddrId, manualAddr.country, manualAddr.state, selectedAddr, newMode, fallbackCountry, knownCodes, dispatch]);
}
