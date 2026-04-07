import { useCallback } from "react";
import { useCart } from "../../../context/CartContext";
import { useUser } from "../../../context/UserContext";
import { orderRepository } from "../../../repositories/OrderRepository";
import { paymentRepository } from "../../../repositories/PaymentRepository";
import { invoiceRepository } from "../../../repositories/InvoiceRepository";
import { loyaltyRepository } from "../../../repositories/LoyaltyRepository";
import { adminGiftCardRepository as giftCardRepository } from "../../../repositories/AdminGiftCardRepository";
import { logger } from "../../../lib/logger";
import { toast } from "sonner";
import type { CheckoutState, CheckoutAction } from "../types";
import { storeLocations, pickupPoints } from "../types";
import type { PaymentMethod } from "../../../context/UserContext";

export function useCheckoutSubmit(
    state: CheckoutState,
    dispatch: React.Dispatch<CheckoutAction>,
    clearCart: () => void,
) {
    const { items } = useCart();
    const { user } = useUser();

    const handleSubmit = useCallback(async () => {
        const {
            contact, selectedAddrId, newMode, manualAddr, selectedStoreId,
            selectedPickupId, selectedPmId, payMethod, loyaltyPoints, loyaltyRate,
            appliedGiftCards, couponCode, couponResult, savedCardCvv,
        } = state;

        /* Derive selected address / payment from user data */
        const selectedAddr = selectedAddrId !== "new"
            ? user.addresses.find((a) => a.id === selectedAddrId)
            : null;
        const selectedPm: PaymentMethod | undefined = selectedPmId !== "new"
            ? user.paymentMethods.find((p) => p.id === selectedPmId)
            : undefined;

        /* Compute totals now (items still in cart) */
        const selectedShipping = state.shippingOptions.find((o) => o.id === state.selectedShippingId);
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const shipping = selectedShipping?.price ?? (state.shippingOptions[0]?.price ?? 0);
        const tax = state.taxCalc?.taxAmount ?? subtotal * 0.1;
        const couponDiscount = couponResult?.valid ? (couponResult.discount ?? 0) : 0;
        const loyaltyDiscount = loyaltyRate > 0 ? loyaltyPoints / loyaltyRate : 0;

        /* Distribute gift card amounts across all applied cards */
        let gcRemaining = subtotal + shipping + tax - couponDiscount - loyaltyDiscount;
        const gcAmounts = appliedGiftCards.map(card => {
            const applied = Math.min(card.balance, Math.max(0, gcRemaining));
            gcRemaining -= applied;
            return { code: card.code, applied };
        });
        const giftCardDiscount = gcAmounts.reduce((sum, a) => sum + a.applied, 0);
        const total = Math.max(0, subtotal + shipping + tax - couponDiscount - loyaltyDiscount - giftCardDiscount);

        /* Step validation */
        const step1Valid = !!(contact.email && contact.phone);
        const step2Valid = selectedAddrId !== "new"
            ? !!selectedAddr
            : newMode === "home"
                ? !!(manualAddr.name && manualAddr.street && manualAddr.city)
                : newMode === "store"
                    ? !!selectedStoreId
                    : !!selectedPickupId;
        const step3Valid = total === 0
            ? true
            : selectedPmId !== "new"
                ? selectedPm?.type === "card" ? !!savedCardCvv : true
                : payMethod === "card"
                    ? !!(state.payment.cardNumber && state.payment.cardName && state.payment.expiry && state.payment.cvv)
                    : payMethod === "paypal"
                        ? !!state.paypalEmail
                        : true;

        if (!step1Valid || !step2Valid || !step3Valid) return;

        dispatch({ type: "PATCH", payload: { isProcessing: true, orderError: null } });
        dispatch({ type: "PATCH", payload: { orderSnapshot: [...items] } });

        dispatch({ type: "PATCH", payload: { totalsSnapshot: { subtotal, shipping, tax, total } } });

        try {
            /* 1 ─ Build shippingAddress object */
            let shippingAddress: Record<string, unknown>;
            const selectedStore = storeLocations.find((s) => s.id === selectedStoreId);
            const selectedPickup = pickupPoints.find((p) => p.id === selectedPickupId);

            if (selectedAddrId !== "new" && selectedAddr) {
                shippingAddress = {
                    fullName: selectedAddr.name,
                    street: selectedAddr.street,
                    city: selectedAddr.city,
                    region: selectedAddr.state,
                    postalCode: selectedAddr.zip,
                    country: selectedAddr.country,
                    phone: contact.phone,
                };
            } else if (newMode === "store" && selectedStore) {
                shippingAddress = {
                    fullName: manualAddr.name || `${user.firstName} ${user.lastName}`,
                    street: selectedStore.address,
                    city: "", region: "", postalCode: "", country: "",
                    phone: contact.phone,
                    locationId: selectedStoreId,
                    locationType: "store",
                    locationName: selectedStore.name,
                };
            } else if (newMode === "pickup" && selectedPickup) {
                shippingAddress = {
                    fullName: manualAddr.name || `${user.firstName} ${user.lastName}`,
                    street: selectedPickup.address,
                    city: "", region: "", postalCode: "", country: "",
                    phone: contact.phone,
                    locationId: selectedPickupId,
                    locationType: "pickup",
                    locationName: selectedPickup.name,
                };
            } else {
                shippingAddress = {
                    fullName: manualAddr.name,
                    street: manualAddr.street,
                    city: manualAddr.city,
                    region: manualAddr.state,
                    postalCode: manualAddr.zip,
                    country: manualAddr.country,
                    phone: contact.phone,
                };
            }

            /* 2 ─ Determine paymentMethod string */
            const activePmType = selectedPm ? selectedPm.type : payMethod;
            const paymentMethodMap: Record<string, string> = {
                card: "CREDIT_CARD", paypal: "PAYPAL", usdt: "CRYPTO_USDT", btc: "CRYPTO_BTC",
            };
            const paymentMethodStr = total === 0
                ? (giftCardDiscount > 0 ? "GIFT_CARD" : "NONE")
                : paymentMethodMap[activePmType] ?? "CREDIT_CARD";

            /* 3 ─ Create order via backend (DRAFT status — no stock deducted yet) */
            const firstGcCode = gcAmounts.find(a => a.applied > 0)?.code;
            const order = await orderRepository.createOrder({
                shippingAddress,
                paymentMethod: paymentMethodStr,
                couponCode: couponResult?.valid ? couponCode.trim() : undefined,
                giftCardCode: firstGcCode ?? undefined,
                giftCardAmount: giftCardDiscount > 0 ? giftCardDiscount : undefined,
                loyaltyPointsUsed: loyaltyPoints > 0 ? loyaltyPoints : undefined,
                loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
                notes: undefined,
            });
            dispatch({ type: "PATCH", payload: { createdOrder: order } });

            /* 4 ─ Process payment (skip if total is fully covered by gift card / discounts) */
            if (total > 0) {
                const activeType = selectedPm ? selectedPm.type : payMethod;
                const methodMap: Record<string, "CARD" | "PAYPAL" | "USDT" | "BTC"> = {
                    card: "CARD", paypal: "PAYPAL", usdt: "USDT", btc: "BTC",
                };

                try {
                    await paymentRepository.processPayment({
                        orderId: order.id,
                        userId: user.id,
                        email: contact.email || user.email,
                        amount: total,
                        currency: "USD",
                        paymentMethod: methodMap[activeType] ?? "CARD",
                    });
                } catch (payErr) {
                    try { await orderRepository.cancelOrder(order.id); } catch (err) { logger.warn("Suppressed error", err); }
                    throw payErr;
                }
            }

            /* 5 ─ Confirm order (DRAFT → PENDING, deducts stock, creates invoice) */
            const confirmed = await orderRepository.confirmOrder(order.id);
            dispatch({ type: "PATCH", payload: { createdOrder: confirmed } });

            /* 5b ─ Redeem loyalty points (if any) */
            if (loyaltyPoints > 0) {
                try {
                    await loyaltyRepository.redeemPoints(
                        loyaltyPoints,
                        `Canjeo en pedido ${confirmed.orderNumber ?? order.id}`,
                        order.id,
                    );
                } catch (err) { logger.warn("Suppressed error", err); }
            }

            /* 5c ─ Redeem gift cards (each one individually) */
            for (const gc of gcAmounts) {
                if (gc.applied > 0) {
                    try {
                        await giftCardRepository.redeem({
                            code: gc.code,
                            amount: gc.applied,
                            orderId: order.id,
                        });
                    } catch (err) { logger.warn("Suppressed error", err); }
                }
            }

            /* 6 ─ Try to fetch the backend invoice */
            try {
                const inv = await invoiceRepository.findByOrderId(order.id);
                dispatch({ type: "PATCH", payload: { backendInvoice: inv } });
            } catch (err) { logger.warn("Suppressed error", err); }

            /* 7 ─ Done */
            dispatch({ type: "PATCH", payload: { isProcessing: false, orderComplete: true } });
            clearCart();
            toast.success("¡Pedido realizado con éxito!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al procesar el pedido";
            dispatch({ type: "PATCH", payload: { isProcessing: false, orderError: msg } });
            toast.error(msg);
        }
    }, [state, items, user, clearCart, dispatch]);

    return handleSubmit;
}
