import { useEffect, useRef } from "react";
import { taxRepository } from "../../../repositories/TaxRepository";
import { logger } from "../../../lib/logger";
import type { CheckoutState, CheckoutAction } from "../types";
import type { Address } from "../../../context/UserContext";

export function useTaxCalculation(
    subtotal: number,
    selectedAddrId: string,
    selectedAddr: Address | null | undefined,
    manualAddr: CheckoutState["manualAddr"],
    newMode: CheckoutState["newMode"],
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const taxTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        clearTimeout(taxTimer.current);
        if (subtotal === 0) return;

        // Determine country/state from selected address
        let country = "US";
        let state: string | undefined;
        if (selectedAddr) {
            country = selectedAddr.country ?? "US";
            state = selectedAddr.state ?? undefined;
        } else if (selectedAddrId === "new" && newMode === "home" && manualAddr.country) {
            country = manualAddr.country;
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
    }, [subtotal, selectedAddrId, manualAddr.country, manualAddr.state, selectedAddr, newMode, dispatch]);
}
