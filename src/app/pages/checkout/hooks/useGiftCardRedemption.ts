import { useCallback } from "react";
import { adminGiftCardRepository as giftCardRepository } from "../../../repositories/AdminGiftCardRepository";
import { logger } from "../../../lib/logger";
import { toast } from "sonner";
import type { CheckoutAction } from "../types";

export function useGiftCardRedemption(
    giftCardCode: string,
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const applyGiftCard = useCallback(async () => {
        const code = giftCardCode.trim();
        if (!code) return;
        dispatch({ type: "PATCH", payload: { giftCardLoading: true, giftCardError: null } });
        try {
            const { balance } = await giftCardRepository.getBalance(code);
            if (balance <= 0) {
                dispatch({
                    type: "PATCH",
                    payload: { giftCardError: "Esta tarjeta no tiene saldo disponible", giftCardBalance: null },
                });
            } else {
                dispatch({ type: "PATCH", payload: { giftCardBalance: balance } });
                toast.success(`Tarjeta aplicada · saldo $${balance.toFixed(2)}`);
            }
        } catch (err) {
            logger.warn("Gift card validation failed", err);
            dispatch({
                type: "PATCH",
                payload: { giftCardError: "Tarjeta no válida o expirada", giftCardBalance: null },
            });
        } finally {
            dispatch({ type: "PATCH", payload: { giftCardLoading: false } });
        }
    }, [giftCardCode, dispatch]);

    return applyGiftCard;
}
