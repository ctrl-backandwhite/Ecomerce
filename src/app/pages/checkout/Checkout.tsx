import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { logger } from "../../lib/logger";
import { useCurrency } from "../../context/CurrencyContext";

import { storeLocations, pickupPoints } from "./types";
import type { PaymentMethod } from "../../context/UserContext";

/* Hooks */
import { useCheckoutState } from "./hooks/useCheckoutState";
import { useShippingOptions } from "./hooks/useShippingOptions";
import { useTaxCalculation } from "./hooks/useTaxCalculation";
import { useCouponValidation } from "./hooks/useCouponValidation";
import { useLoyaltyRedemption } from "./hooks/useLoyaltyRedemption";
import { useGiftCardRedemption } from "./hooks/useGiftCardRedemption";
import { useCheckoutSubmit } from "./hooks/useCheckoutSubmit";

/* Components */
import { ContactStep } from "./components/ContactStep";
import { AddressStep } from "./components/AddressStep";
import { PaymentStep } from "./components/PaymentStep";
import { OrderSummary } from "./components/OrderSummary";
import { OrderConfirmation } from "./components/OrderConfirmation";

export function Checkout() {
    const { items, getTotalPrice, clearCart } = useCart();
    const { user } = useUser();
    const { convertFromUsd } = useCurrency();
    const navigate = useNavigate();

    const [state, dispatch] = useCheckoutState(user);

    /* ── Derived: address for shipping / tax ── */
    const selectedAddr = state.selectedAddrId !== "new"
        ? user.addresses.find((a) => a.id === state.selectedAddrId) : null;

    /* ── Side-effect hooks ── */
    useShippingOptions(getTotalPrice(), state.selectedAddrId, selectedAddr, state.manualAddr, state.newMode, dispatch);
    useLoyaltyRedemption(user.id, dispatch);

    /* ── Fetch BTC rate from CoinGecko ── */
    useEffect(() => {
        let cancelled = false;
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data?.bitcoin?.usd) dispatch({ type: "PATCH", payload: { btcRate: data.bitcoin.usd } });
            })
            .catch((err) => { logger.warn("BTC rate fetch failed", err); });
        return () => { cancelled = true; };
    }, [dispatch]);

    /* ── Derived values ── */
    const selectedStore = storeLocations.find((s) => s.id === state.selectedStoreId);
    const selectedPickup = pickupPoints.find((p) => p.id === state.selectedPickupId);
    const selectedPm: PaymentMethod | undefined = state.selectedPmId !== "new"
        ? user.paymentMethods.find((p) => p.id === state.selectedPmId) : undefined;

    const subtotal = getTotalPrice();
    const selectedShipping = state.shippingOptions.find((o) => o.id === state.selectedShippingId);
    const shippingUsd = selectedShipping?.price ?? (state.shippingOptions[0]?.price ?? 0);
    const shipping = convertFromUsd(shippingUsd);
    const tax = state.taxCalc?.taxAmount ?? 0;

    /* Coupon: PERCENTAGE discount was computed against the display-currency subtotal,
       FIXED discount is a raw USD amount that needs conversion. */
    const couponRaw = state.couponResult?.valid ? (state.couponResult.discount ?? 0) : 0;
    const couponType = state.couponResult?.coupon?.type;
    const couponDiscount = couponType === "FIXED" ? convertFromUsd(couponRaw) : couponRaw;

    /* Loyalty: points ÷ rate = USD → convert to display currency */
    const loyaltyDiscountUsd = state.loyaltyRate > 0 ? state.loyaltyPoints / state.loyaltyRate : 0;
    const loyaltyDiscount = convertFromUsd(loyaltyDiscountUsd);

    /* Distribute gift card amounts across all applied cards
       (card.balance is in USD → convert before comparison) */
    let gcRemaining = subtotal + shipping + tax - couponDiscount - loyaltyDiscount;
    const appliedAmounts = state.appliedGiftCards.map(card => {
        const balanceLocal = convertFromUsd(card.balance);
        const applied = Math.min(balanceLocal, Math.max(0, gcRemaining));
        gcRemaining -= applied;
        return { code: card.code, applied };
    });
    const giftCardDiscount = appliedAmounts.reduce((sum, a) => sum + a.applied, 0);
    const total = Math.max(0, subtotal + shipping + tax - couponDiscount - loyaltyDiscount - giftCardDiscount);

    /* maxRedeemable: convert display-currency total to USD before multiplying by
       loyaltyRate (points per $1 USD) to get correct point cap. */
    const xRate = convertFromUsd(1);
    const totalBeforeLoyaltyUsd = xRate > 0
        ? (subtotal + shipping + tax - couponDiscount) / xRate
        : (subtotal + shipping + tax - couponDiscount);
    const maxRedeemable = Math.min(state.loyaltyBalance, Math.floor(totalBeforeLoyaltyUsd * state.loyaltyRate));

    /* ── Tax calculation (debounced) ── */
    useTaxCalculation(subtotal, state.selectedAddrId, selectedAddr, state.manualAddr, state.newMode, dispatch);

    /* ── Async action hooks ── */
    const applyCoupon = useCouponValidation(state.couponCode, subtotal, dispatch);
    const applyManualCard = useGiftCardRedemption(state.giftCardCode, state.appliedGiftCards, dispatch);
    const handleSubmit = useCheckoutSubmit(state, dispatch, clearCart);

    /* ── Step validation ── */
    const step1Valid = !!(state.contact.email && state.contact.phone);
    const step2Valid = state.selectedAddrId !== "new"
        ? !!selectedAddr
        : state.newMode === "home"
            ? !!(state.manualAddr.name && state.manualAddr.street && state.manualAddr.city)
            : state.newMode === "store"
                ? !!state.selectedStoreId
                : !!state.selectedPickupId;
    const step3Valid = total === 0
        ? true
        : state.selectedPmId !== "new"
            ? selectedPm?.type === "card" ? !!state.savedCardCvv : true
            : state.payMethod === "card"
                ? !!(state.payment.cardNumber && state.payment.cardName && state.payment.expiry && state.payment.cvv)
                : state.payMethod === "paypal"
                    ? !!state.paypalEmail
                    : true;

    /* ── Delivery / Payment summary helpers ── */
    function deliverySummary() {
        if (selectedAddr) {
            return selectedAddr.deliveryType === "home"
                ? `${selectedAddr.street}, ${selectedAddr.city}, ${selectedAddr.state} ${selectedAddr.zip}`
                : selectedAddr.locationName ?? "";
        }
        if (state.newMode === "home" && state.manualAddr.street) return `${state.manualAddr.street}, ${state.manualAddr.city}`;
        if (state.newMode === "store" && selectedStore) return `${selectedStore.name} · ${selectedStore.address}`;
        if (state.newMode === "pickup" && selectedPickup) return `${selectedPickup.name} · ${selectedPickup.address}`;
        return "";
    }

    function paymentSummaryLabel() {
        if (selectedPm) {
            if (selectedPm.type === "card") return `${selectedPm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${selectedPm.cardLast4}`;
            if (selectedPm.type === "paypal") return `PayPal · ${selectedPm.paypalEmail}`;
            if (selectedPm.type === "usdt") return `USDT · ${selectedPm.cryptoNetwork}`;
            if (selectedPm.type === "btc") return `Bitcoin · ${selectedPm.cryptoNetwork}`;
        }
        if (state.selectedPmId === "new") {
            if (state.payMethod === "card" && state.payment.cardNumber)
                return `•••• •••• •••• ${state.payment.cardNumber.replace(/\s/g, "").slice(-4)}`;
            if (state.payMethod === "paypal") return `PayPal · ${state.paypalEmail}`;
            if (state.payMethod === "usdt") return "USDT (TRC-20)";
            if (state.payMethod === "btc") return "Bitcoin (BTC)";
        }
        return "";
    }

    /* ── Order confirmed screen ── */
    if (state.orderComplete) return <OrderConfirmation state={state} />;

    /* ── Empty cart redirect ── */
    if (items.length === 0) { navigate("/cart"); return null; }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => navigate("/cart")}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Volver al carrito
                </button>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        <h1 className="text-xl text-gray-900 mb-6">Finalizar compra</h1>

                        <ContactStep state={state} dispatch={dispatch} step1Valid={step1Valid} />
                        <AddressStep state={state} dispatch={dispatch} user={user} step2Valid={step2Valid} deliverySummary={deliverySummary()}
                            shippingOptions={state.shippingOptions}
                            selectedShippingId={state.selectedShippingId}
                            shippingLoading={state.shippingLoading}
                        />
                        <PaymentStep
                            state={state} dispatch={dispatch} user={user}
                            step3Valid={step3Valid} total={total} btcRate={state.btcRate}
                            isProcessing={state.isProcessing}
                            paymentSummaryLabel={paymentSummaryLabel()}
                            handleSubmit={handleSubmit}
                        />
                    </div>

                    <OrderSummary
                        items={items} subtotal={subtotal} shipping={shipping}
                        tax={tax} total={total} taxLoading={state.taxLoading}
                        taxCalc={state.taxCalc} selectedShipping={selectedShipping}
                        couponCode={state.couponCode} couponLoading={state.couponLoading}
                        couponResult={state.couponResult} couponDiscount={couponDiscount}
                        loyaltyBalance={state.loyaltyBalance} loyaltyPoints={state.loyaltyPoints}
                        loyaltyRate={state.loyaltyRate} loyaltyDiscount={loyaltyDiscount}
                        maxRedeemable={maxRedeemable}
                        giftCardCode={state.giftCardCode} giftCardLoading={state.giftCardLoading}
                        giftCardError={state.giftCardError}
                        appliedGiftCards={state.appliedGiftCards}
                        myGiftCards={state.myGiftCards}
                        myGiftCardsLoaded={state.myGiftCardsLoaded}
                        giftCardDiscount={giftCardDiscount}
                        appliedAmounts={appliedAmounts}
                        remainingTotal={total}
                        deliverySummary={deliverySummary()} selectedAddrId={state.selectedAddrId}
                        newMode={state.newMode}
                        dispatch={dispatch} applyCoupon={applyCoupon} applyManualCard={applyManualCard}
                    />
                </div>
            </div>
        </div>
    );
}
