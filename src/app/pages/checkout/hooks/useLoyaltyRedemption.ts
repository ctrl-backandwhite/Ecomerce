import { useEffect } from "react";
import { loyaltyRepository } from "../../../repositories/LoyaltyRepository";
import { logger } from "../../../lib/logger";
import type { CheckoutAction } from "../types";

export function useLoyaltyRedemption(
    userId: string,
    dispatch: React.Dispatch<CheckoutAction>,
) {
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        Promise.all([
            loyaltyRepository.getBalance().catch(() => null),
            loyaltyRepository.getRedemptionRate().catch(() => null),
        ]).then(([bal, rate]) => {
            if (cancelled) return;
            const patch: Record<string, unknown> = {};
            if (bal) patch.loyaltyBalance = bal.balance;
            if (rate) patch.loyaltyRate = rate.pointsPerDollar;
            if (Object.keys(patch).length > 0) dispatch({ type: "PATCH", payload: patch });
        }).catch((err) => {
            logger.warn("Loyalty data fetch failed", err);
        });
        return () => { cancelled = true; };
    }, [userId, dispatch]);
}
