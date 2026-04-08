import { MapPin, Store, Package2 } from "lucide-react";
import type { CartItem } from "../../../context/CartContext";
import type { ShippingOption } from "../../../repositories/ShippingRepository";
import type { CouponValidation } from "../../../repositories/CouponRepository";
import { CouponInput } from "./CouponInput";
import { LoyaltySection } from "./LoyaltySection";
import { GiftCardSection } from "./GiftCardSection";
import { useCurrency } from "../../../context/CurrencyContext";
import type { CheckoutAction, AppliedGiftCard, MyGiftCard } from "../types";

interface OrderSummaryProps {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    taxLoading: boolean;
    taxCalc: unknown;
    selectedShipping: ShippingOption | undefined;
    couponCode: string;
    couponLoading: boolean;
    couponResult: CouponValidation | null;
    couponDiscount: number;
    loyaltyBalance: number;
    loyaltyPoints: number;
    loyaltyRate: number;
    loyaltyDiscount: number;
    maxRedeemable: number;
    giftCardCode: string;
    giftCardLoading: boolean;
    giftCardError: string | null;
    appliedGiftCards: AppliedGiftCard[];
    myGiftCards: MyGiftCard[];
    myGiftCardsLoaded: boolean;
    giftCardDiscount: number;
    appliedAmounts: { code: string; applied: number }[];
    remainingTotal: number;
    deliverySummary: string;
    selectedAddrId: string;
    newMode: string;
    dispatch: React.Dispatch<CheckoutAction>;
    applyCoupon: () => void;
    applyManualCard: () => void;
}

export function OrderSummary({
    items, subtotal, shipping, tax, total, taxLoading, taxCalc,
    selectedShipping,
    couponCode, couponLoading, couponResult, couponDiscount,
    loyaltyBalance, loyaltyPoints, loyaltyRate, loyaltyDiscount, maxRedeemable,
    giftCardCode, giftCardLoading, giftCardError,
    appliedGiftCards, myGiftCards, myGiftCardsLoaded, giftCardDiscount,
    appliedAmounts, remainingTotal,
    deliverySummary, selectedAddrId, newMode,
    dispatch, applyCoupon, applyManualCard,
}: OrderSummaryProps) {
    const { formatPrice } = useCurrency();

    /* ── Rounding-safe total ──
     * All amounts now come pre-converted from the backend via X-Currency header.
     * No client-side currency conversion needed — just round for display.
     */
    const roundRaw = (n: number) => Math.round(n * 100) / 100;
    const rSubtotal = roundRaw(subtotal);
    const rShipping = roundRaw(shipping);
    const rTax = roundRaw(tax);
    const rCoupon = roundRaw(couponDiscount);
    const rLoyalty = roundRaw(loyaltyDiscount);
    const rGiftCard = roundRaw(giftCardDiscount);
    const displayTotal = Math.max(0, rSubtotal + rShipping + rTax - rCoupon - rLoyalty - rGiftCard);

    return (
        <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm text-gray-900">Resumen del pedido</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{items.length} {items.length === 1 ? "producto" : "productos"}</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="relative flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                />
                                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none px-1">
                                    {item.quantity}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
                                {(item as any).selectedAttrs && Object.keys((item as any).selectedAttrs).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries((item as any).selectedAttrs as Record<string, string>).map(([k, v]) => (
                                            <span key={k} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-px rounded">
                                                {k}: {v}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                    ))}
                </div>

                {/* Coupon */}
                <CouponInput
                    couponCode={couponCode}
                    couponLoading={couponLoading}
                    couponResult={couponResult}
                    couponDiscount={couponDiscount}
                    dispatch={dispatch}
                    applyCoupon={applyCoupon}
                />

                {/* Loyalty */}
                <LoyaltySection
                    loyaltyBalance={loyaltyBalance}
                    loyaltyPoints={loyaltyPoints}
                    loyaltyRate={loyaltyRate}
                    loyaltyDiscount={loyaltyDiscount}
                    maxRedeemable={maxRedeemable}
                    dispatch={dispatch}
                />

                {/* Gift card */}
                <GiftCardSection
                    giftCardCode={giftCardCode}
                    giftCardLoading={giftCardLoading}
                    giftCardError={giftCardError}
                    appliedGiftCards={appliedGiftCards}
                    myGiftCards={myGiftCards}
                    myGiftCardsLoaded={myGiftCardsLoaded}
                    giftCardDiscount={giftCardDiscount}
                    appliedAmounts={appliedAmounts}
                    remainingTotal={remainingTotal}
                    dispatch={dispatch}
                    applyManualCard={applyManualCard}
                />

                {/* Totals */}
                <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Envío{selectedShipping ? ` · ${selectedShipping.name}` : ""}</span>
                        <span className={shipping === 0 && selectedShipping ? "text-green-600" : shipping === 0 ? "text-amber-500" : ""}>
                            {shipping === 0 && selectedShipping ? "Gratis" : shipping === 0 ? "No disponible" : formatPrice(shipping)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Impuestos{taxCalc ? "" : " (est.)"}{taxLoading ? " …" : ""}</span>
                        <span>{formatPrice(tax)}</span>
                    </div>
                    {couponDiscount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                            <span>Cupón ({couponCode})</span>
                            <span>-{formatPrice(couponDiscount)}</span>
                        </div>
                    )}
                    {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-xs text-amber-600">
                            <span>Puntos ({loyaltyPoints} pts)</span>
                            <span>-{formatPrice(loyaltyDiscount)}</span>
                        </div>
                    )}
                    {giftCardDiscount > 0 && (
                        <div className="flex justify-between text-xs text-violet-600">
                            <span>Tarjeta regalo</span>
                            <span>-{formatPrice(giftCardDiscount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-900 pt-2.5 border-t border-gray-100">
                        <span>Total</span>
                        <span>{formatPrice(displayTotal)}</span>
                    </div>
                </div>

                {/* Delivery summary */}
                {deliverySummary && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-start gap-2">
                            {selectedAddrId === "new" && newMode === "store" ? (
                                <Store className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                            ) : selectedAddrId === "new" && newMode === "pickup" ? (
                                <Package2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                            ) : (
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                            )}
                            <div>
                                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">
                                    {selectedAddrId === "new" && newMode === "store" ? "Recogida en tienda"
                                        : selectedAddrId === "new" && newMode === "pickup" ? "Punto de entrega"
                                            : "Entrega en"}
                                </p>
                                <p className="text-xs text-gray-600">{deliverySummary}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
