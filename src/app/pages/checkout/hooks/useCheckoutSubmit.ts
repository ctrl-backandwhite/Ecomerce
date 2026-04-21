import { useCallback } from "react";
import { useCart } from "../../../context/CartContext";
import { useUser } from "../../../context/UserContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { orderRepository } from "../../../repositories/OrderRepository";
import { paymentRepository } from "../../../repositories/PaymentRepository";
import { invoiceRepository } from "../../../repositories/InvoiceRepository";
import { loyaltyRepository } from "../../../repositories/LoyaltyRepository";
import { cartRepository } from "../../../repositories/CartRepository";
import { profileRepository } from "../../../repositories/ProfileRepository";
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
    const { currency } = useCurrency();

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
        const tax = state.taxCalc?.taxAmount ?? 0;
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
                card: "CARD", paypal: "PAYPAL", usdt: "USDT", btc: "BTC",
            };
            const paymentMethodStr = total === 0
                ? (giftCardDiscount > 0 ? "GIFT_CARD" : "NONE")
                : paymentMethodMap[activePmType] ?? "CARD";

            /* 2b ─ Ensure the backend has the same cart we're showing.
             *
             * The cart lives locally in CartContext (localStorage + optimistic
             * backend sync). If guest-merge was skipped at login time the
             * backend cart may be empty, and `/api/v1/orders/from-cart`
             * rejects with OR002 "No active cart found for this user/session".
             *
             * Strategy: fetch the backend cart. If it matches the local one
             * (same line count), skip. Otherwise wipe + repopulate so the
             * backend sees exactly what the user is paying for.
             */
            if (items.length > 0) {
                try {
                    let backendEmptyOrMismatch = true;
                    try {
                        const existing = await cartRepository.getActiveCart();
                        backendEmptyOrMismatch = !existing?.items || existing.items.length !== items.length;
                    } catch {
                        // 404 / no active cart → treat as empty, will populate below
                        backendEmptyOrMismatch = true;
                    }

                    if (backendEmptyOrMismatch) {
                        try { await cartRepository.clearCart(); } catch (err) { logger.warn("Suppressed error", err); }
                        for (const it of items) {
                            await cartRepository.addItem({
                                productId: it.productId ?? it.id,
                                variantId: it.variantId,
                                quantity: it.quantity,
                                unitPrice: it.price,
                                productName: it.name,
                                productImage: it.image,
                                selectedAttrs: it.selectedAttrs,
                            });
                        }
                    }
                } catch (syncErr) {
                    logger.warn("[Checkout] cart sync failed before createOrder", syncErr);
                    // Keep going; createOrder will surface the real error in the toast.
                }
            }

            /* 3 ─ Create order via backend (DRAFT status — no stock deducted yet) */
            const firstGcCode = gcAmounts.find(a => a.applied > 0)?.code;
            const userCurrency = currency?.currencyCode ?? "USD";
            const order = await orderRepository.createOrder({
                shippingAddress,
                paymentMethod: paymentMethodStr,
                couponCode: couponResult?.valid ? couponCode.trim() : undefined,
                giftCardCode: firstGcCode ?? undefined,
                giftCardAmount: giftCardDiscount > 0 ? giftCardDiscount : undefined,
                loyaltyPointsUsed: loyaltyPoints > 0 ? loyaltyPoints : undefined,
                loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
                currencyCode: userCurrency,
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
                        amount: order.total,
                        currency: order.currencyCode ?? userCurrency,
                        paymentMethod: methodMap[activeType] ?? "CARD",
                    });
                } catch (payErr) {
                    try { await orderRepository.cancelOrder(order.id); } catch (err) { logger.warn("Suppressed error", err); }
                    throw payErr;
                }

                /* 4b ─ Save the new payment method to the user's profile so the
                 *      next checkout offers it in the saved-methods list.
                 *      Runs only when the user just typed a new method AND
                 *      ticked the "save for future" checkbox. Failures are
                 *      non-fatal — the order is already paid.
                 */
                if (selectedPmId === "new" && state.saveNewPaymentMethod) {
                    try {
                        if (payMethod === "card" && state.payment.cardNumber) {
                            const digits = state.payment.cardNumber.replace(/\s/g, "");
                            const last4 = digits.slice(-4);
                            const brand = digits.startsWith("4") ? "visa" : "mastercard";
                            // Dedup: if the user already has a card with the
                            // same brand + last4, skip — we don't want
                            // duplicates in the saved-methods dropdown.
                            const alreadySaved = user.paymentMethods.some(
                                (pm) => pm.type === "card"
                                    && pm.cardLast4 === last4
                                    && (pm.cardBrand ?? "").toLowerCase() === brand,
                            );
                            if (!alreadySaved) {
                                const [mm, yy] = state.payment.expiry.split("/").map((s) => s.trim());
                                await profileRepository.createPaymentMethod({
                                    type: "CARD",
                                    label: `${brand === "visa" ? "Visa" : "Mastercard"} ···· ${last4}`,
                                    last4,
                                    brand,
                                    expiryMonth: parseInt(mm, 10) || undefined,
                                    expiryYear: yy ? (2000 + parseInt(yy, 10)) : undefined,
                                    isDefault: user.paymentMethods.length === 0,
                                });
                            } else {
                                logger.debug("[Checkout] card already saved — skipping createPaymentMethod");
                            }
                        } else if (payMethod === "paypal" && state.paypalEmail) {
                            const email = state.paypalEmail.trim().toLowerCase();
                            const alreadySaved = user.paymentMethods.some(
                                (pm) => pm.type === "paypal"
                                    && (pm.paypalEmail ?? "").trim().toLowerCase() === email,
                            );
                            if (!alreadySaved) {
                                await profileRepository.createPaymentMethod({
                                    type: "PAYPAL",
                                    label: `PayPal · ${state.paypalEmail}`,
                                    paypalEmail: state.paypalEmail,
                                    isDefault: user.paymentMethods.length === 0,
                                });
                            } else {
                                logger.debug("[Checkout] PayPal already saved — skipping createPaymentMethod");
                            }
                        }
                    } catch (saveErr) {
                        logger.warn("[Checkout] could not persist payment method", saveErr);
                    }
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
