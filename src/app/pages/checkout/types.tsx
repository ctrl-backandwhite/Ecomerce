import type { CartItem } from "../../context/CartContext";
import type { Order } from "../../repositories/OrderRepository";
import type { ShippingOption } from "../../repositories/ShippingRepository";
import type { TaxCalculation } from "../../repositories/TaxRepository";
import type { CouponValidation } from "../../repositories/CouponRepository";
import type { Invoice } from "../../repositories/InvoiceRepository";
import type React from "react";
import {
    Truck, Store, Package2, Home, Briefcase, MapPin,
} from "lucide-react";

/* ── Delivery type ───────────────────────────────────────── */
export type DeliveryType = "home" | "store" | "pickup";

/* ── Payment method type ─────────────────────────────────── */
export type PayMethod = "card" | "paypal" | "usdt" | "btc";

/* ── Delivery type metadata ──────────────────────────────── */
export const deliveryMeta: Record<DeliveryType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    home: { label: "Envío a domicilio", icon: <Truck className="w-4 h-4" strokeWidth={1.5} />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    store: { label: "Recogida en tienda", icon: <Store className="w-4 h-4" strokeWidth={1.5} />, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
    pickup: { label: "Punto de entrega", icon: <Package2 className="w-4 h-4" strokeWidth={1.5} />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

/* ── Mock crypto addresses ───────────────────────────────── */
export const MOCK_USDT_ADDRESS = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
export const MOCK_BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

/* ── Mock store locations ──────────────────────────────────── */
export const storeLocations = [
    { id: "store-1", name: "NX036 Manhattan – Fifth Ave", address: "350 Fifth Avenue, New York, NY 10118", hours: "Mon–Sat 9am–9pm · Sun 11am–7pm", distance: "0.8 mi" },
    { id: "store-2", name: "NX036 Brooklyn – Atlantic Ave", address: "530 Atlantic Ave, Brooklyn, NY 11217", hours: "Mon–Sat 10am–8pm · Sun 12pm–6pm", distance: "3.2 mi" },
    { id: "store-3", name: "NX036 Queens – Jamaica Center", address: "168-16 Jamaica Ave, Queens, NY 11432", hours: "Mon–Sun 9am–9pm", distance: "7.4 mi" },
    { id: "store-4", name: "NX036 London – Oxford Street", address: "374 Oxford Street, London W1C 1JX, UK", hours: "Mon–Sat 9am–8pm · Sun 12pm–6pm", distance: "—" },
];

/* ── Mock pickup points ──────────────────────────────────── */
export const pickupPoints = [
    { id: "pp-1", name: "InPost Locker – Penn Station", address: "2 Penn Plaza, New York, NY 10121", hours: "24/7", distance: "0.3 mi", type: "Locker" },
    { id: "pp-2", name: "UPS Access Point – Midtown", address: "410 Lexington Ave, New York, NY 10017", hours: "Mon–Fri 8am–8pm · Sat 9am–5pm", distance: "1.1 mi", type: "Access Point" },
    { id: "pp-3", name: "InPost Locker – Grand Central", address: "89 E 42nd St, New York, NY 10017", hours: "24/7", distance: "1.4 mi", type: "Locker" },
    { id: "pp-4", name: "FedEx Drop Box – Herald Square", address: "1 Herald Square, New York, NY 10001", hours: "Mon–Fri 8am–6pm", distance: "0.9 mi", type: "Drop Box" },
    { id: "pp-5", name: "UPS Access Point – Chelsea", address: "185 Seventh Ave, New York, NY 10011", hours: "Mon–Fri 8am–8pm · Sat 9am–5pm", distance: "1.8 mi", type: "Access Point" },
];

/* ── Helper: icon by address label ───────────────────────── */
export function labelIcon(label: string) {
    const l = label.toLowerCase();
    if (l === "home" || l === "casa") return <Home className="w-3.5 h-3.5" strokeWidth={1.5} />;
    if (l === "office" || l === "trabajo") return <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />;
    return <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />;
}

/* ── Applied gift card ────────────────────────────────────── */
export interface AppliedGiftCard {
    code: string;
    balance: number;
}

/* ── User's gift card (for selector) ─────────────────────── */
export interface MyGiftCard {
    code: string;
    balance: number;
    originalAmount: number;
}

/* ── Checkout state ──────────────────────────────────────── */
export interface CheckoutState {
    step: 1 | 2 | 3;
    isProcessing: boolean;
    orderComplete: boolean;
    orderSnapshot: CartItem[];
    createdOrder: Order | null;
    backendInvoice: Invoice | null;
    orderError: string | null;
    totalsSnapshot: { subtotal: number; shipping: number; tax: number; total: number } | null;
    contact: { email: string; phone: string };
    selectedAddrId: string;
    newMode: DeliveryType;
    manualAddr: { name: string; street: string; city: string; state: string; zip: string; country: string };
    selectedStoreId: string | null;
    selectedPickupId: string | null;
    selectedPmId: string;
    payMethod: PayMethod;
    payment: { cardNumber: string; cardName: string; expiry: string; cvv: string };
    stripeElementsComplete: { number: boolean; expiry: boolean; cvc: boolean };
    paypalEmail: string;
    copiedAddr: boolean;
    savedCardCvv: string;
    pmDropdownOpen: boolean;
    /** When true, the new payment method entered at checkout will be persisted
     *  to the user's profile after a successful order. */
    saveNewPaymentMethod: boolean;
    shippingOptions: ShippingOption[];
    selectedShippingId: string | null;
    shippingLoading: boolean;
    /** Set when CJ responds 422 — destination country is not in the allowlist. */
    cjCountryBlocked: boolean;
    /** ISO code that came back blocked, for UI messaging. */
    cjBlockedCountry: string | null;
    /** Set when the CJ quote endpoint fails for any other reason (network, 5xx). */
    cjQuoteError: string | null;
    taxCalc: TaxCalculation | null;
    taxLoading: boolean;
    couponCode: string;
    couponResult: CouponValidation | null;
    couponLoading: boolean;
    loyaltyBalance: number;
    loyaltyRate: number;
    loyaltyPoints: number;
    appliedGiftCards: AppliedGiftCard[];
    myGiftCards: MyGiftCard[];
    myGiftCardsLoaded: boolean;
    giftCardCode: string;
    giftCardLoading: boolean;
    giftCardError: string | null;
    btcRate: number;
}

/* ── Checkout actions ────────────────────────────────────── */
export type CheckoutAction =
    | { type: "PATCH"; payload: Partial<CheckoutState> }
    | { type: "SET_STEP"; step: 1 | 2 | 3 }
    | { type: "SET_CONTACT"; payload: Partial<CheckoutState["contact"]> }
    | { type: "SET_MANUAL_ADDR"; payload: Partial<CheckoutState["manualAddr"]> }
    | { type: "SET_PAYMENT"; payload: Partial<CheckoutState["payment"]> }
    | { type: "SET_STRIPE_COMPLETE"; field: "number" | "expiry" | "cvc"; complete: boolean }
    | { type: "SYNC_PROFILE"; payload: { email: string; phone: string; firstName: string; lastName: string; defaultAddrId?: string; defaultPmId?: string } }
    | { type: "RESET_COUPON" }
    | { type: "RESET_GIFT_CARD" }
    | { type: "TOGGLE_GIFT_CARD"; code: string; balance: number }
    | { type: "REMOVE_GIFT_CARD"; code: string };
