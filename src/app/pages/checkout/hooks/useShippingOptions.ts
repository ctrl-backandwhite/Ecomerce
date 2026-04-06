import { useEffect } from "react";
import { shippingRepository } from "../../../repositories/ShippingRepository";
import { logger } from "../../../lib/logger";
import type { CheckoutAction } from "../types";

export function useShippingOptions(dispatch: React.Dispatch<CheckoutAction>) {
    useEffect(() => {
        let cancelled = false;
        dispatch({ type: "PATCH", payload: { shippingLoading: true } });
        shippingRepository
            .getOptions()
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
    }, [dispatch]);
}
