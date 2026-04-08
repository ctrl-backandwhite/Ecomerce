import { useEffect, useRef, useMemo } from "react";
import { shippingRepository } from "../../../repositories/ShippingRepository";
import { useTimezone } from "../../../context/TimezoneContext";
import { resolveCountryCode } from "../../../utils/resolveCountryCode";
import { logger } from "../../../lib/logger";
import type { CheckoutState, CheckoutAction } from "../types";
import type { Address } from "../../../context/UserContext";

export function useShippingOptions(
    subtotal: number,
    selectedAddrId: string,
    selectedAddr: Address | null | undefined,
    manualAddr: CheckoutState["manualAddr"],
    newMode: CheckoutState["newMode"],
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const { selectedCountry, countries } = useTimezone();
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const fallbackCountry = selectedCountry?.code ?? "US";

    const knownCodes = useMemo(
        () => countries.map((c) => c.code),
        [countries],
    );

    useEffect(() => {
        clearTimeout(timer.current);
        if (subtotal === 0) return;

        // Resolve country ISO code from selected address
        let country = fallbackCountry;
        if (selectedAddr) {
            country = selectedAddr.country
                ? resolveCountryCode(selectedAddr.country, knownCodes)
                : fallbackCountry;
        } else if (selectedAddrId === "new" && newMode === "home" && manualAddr.country) {
            country = resolveCountryCode(manualAddr.country, knownCodes);
        }

        timer.current = setTimeout(() => {
            let cancelled = false;
            dispatch({ type: "PATCH", payload: { shippingLoading: true } });
            shippingRepository
                .getOptions({ country, subtotal: String(subtotal) })
                .then((opts) => {
                    if (cancelled) return;
                    dispatch({
                        type: "PATCH",
                        payload: {
                            shippingOptions: opts,
                            selectedShippingId: opts.length > 0 ? opts[0].id : null,
                        },
                    });
                })
                .catch((err) => { logger.warn("Failed to fetch shipping options", err); })
                .finally(() => { if (!cancelled) dispatch({ type: "PATCH", payload: { shippingLoading: false } }); });
            return () => { cancelled = true; };
        }, 400);
        return () => clearTimeout(timer.current);
    }, [subtotal, selectedAddrId, selectedAddr, manualAddr.country, newMode, fallbackCountry, knownCodes, dispatch]);
}
