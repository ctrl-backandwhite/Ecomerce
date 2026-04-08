import { useCallback, useEffect } from "react";
import { adminGiftCardRepository } from "../../../repositories/AdminGiftCardRepository";
import { giftCardRepository } from "../../../repositories/GiftCardRepository";
import { useCurrency } from "../../../context/CurrencyContext";
import { logger } from "../../../lib/logger";
import { toast } from "sonner";
import type { CheckoutAction, AppliedGiftCard } from "../types";

export function useGiftCardRedemption(
    giftCardCode: string,
    appliedGiftCards: AppliedGiftCard[],
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const { formatPrice } = useCurrency();
    /* ── Fetch user's active gift cards on mount ── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const cards = await giftCardRepository.getMyReceived();
                const active = cards
                    .filter(c => c.status === "ACTIVE" && c.balance > 0)
                    .map(c => ({ code: c.code, balance: Number(c.balance), originalAmount: Number(c.originalAmount) }));
                if (!cancelled) {
                    dispatch({ type: "PATCH", payload: { myGiftCards: active, myGiftCardsLoaded: true } });
                }
            } catch (err) {
                logger.warn("Failed to fetch user gift cards", err);
                if (!cancelled) dispatch({ type: "PATCH", payload: { myGiftCardsLoaded: true } });
            }
        })();
        return () => { cancelled = true; };
    }, [dispatch]);

    /* ── Apply a manual gift card code ── */
    const applyManualCard = useCallback(async () => {
        const code = giftCardCode.trim();
        if (!code) return;
        if (appliedGiftCards.some(c => c.code === code)) {
            dispatch({ type: "PATCH", payload: { giftCardError: "Esta tarjeta ya fue aplicada" } });
            return;
        }
        dispatch({ type: "PATCH", payload: { giftCardLoading: true, giftCardError: null } });
        try {
            const { balance } = await adminGiftCardRepository.getBalance(code);
            if (balance <= 0) {
                dispatch({ type: "PATCH", payload: { giftCardError: "Esta tarjeta no tiene saldo disponible", giftCardLoading: false } });
            } else {
                dispatch({
                    type: "PATCH", payload: {
                        appliedGiftCards: [...appliedGiftCards, { code, balance }],
                        giftCardCode: "",
                        giftCardLoading: false,
                        giftCardError: null,
                    }
                });
                toast.success(`Tarjeta aplicada · saldo ${formatPrice(balance)}`);
            }
        } catch (err) {
            logger.warn("Gift card validation failed", err);
            dispatch({ type: "PATCH", payload: { giftCardError: "Tarjeta no válida o expirada", giftCardLoading: false } });
        }
    }, [giftCardCode, appliedGiftCards, dispatch, formatPrice]);

    return applyManualCard;
}
