import { useCallback } from "react";
import { couponRepository } from "../../../repositories/CouponRepository";
import { useCurrency } from "../../../context/CurrencyContext";
import { logger } from "../../../lib/logger";
import { toast } from "sonner";
import type { CheckoutAction } from "../types";

export function useCouponValidation(
    couponCode: string,
    subtotal: number,
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const { formatPrice } = useCurrency();
    const applyCoupon = useCallback(async () => {
        if (!couponCode.trim()) return;
        dispatch({ type: "PATCH", payload: { couponLoading: true } });
        try {
            const res = await couponRepository.validate(couponCode.trim(), subtotal);
            dispatch({ type: "PATCH", payload: { couponResult: res } });
            if (!res.valid) toast.error(res.message ?? "Cupón no válido");
            else toast.success(`Cupón aplicado: -${formatPrice(res.discount ?? 0)}`);
        } catch (err) {
            logger.warn("Coupon validation failed", err);
            toast.error("No se pudo validar el cupón");
            dispatch({ type: "PATCH", payload: { couponResult: null } });
        } finally {
            dispatch({ type: "PATCH", payload: { couponLoading: false } });
        }
    }, [couponCode, subtotal, dispatch, formatPrice]);

    return applyCoupon;
}
