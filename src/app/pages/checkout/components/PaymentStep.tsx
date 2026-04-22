import { useState } from "react";
import { useCurrency } from "../../../context/CurrencyContext";
import {
    ChevronRight, ChevronDown, ChevronLeft, Check, Plus,
    Lock, Shield, Mail, AlertCircle, Copy, Gift,
} from "lucide-react";
import {
    VisaLogo, MastercardLogo, PayPalLogo, USDTLogo, BTCLogo,
} from "../../../components/PaymentLogos";
import { StepBadge, Section } from "./StepIndicator";
import { MOCK_USDT_ADDRESS, MOCK_BTC_ADDRESS } from "../types";
import type { CheckoutState, CheckoutAction } from "../types";
import type { UserProfile, PaymentMethod } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";
import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import type { StripeElementChangeEvent } from "@stripe/stripe-js";

interface PaymentStepProps {
    state: CheckoutState;
    dispatch: React.Dispatch<CheckoutAction>;
    user: UserProfile;
    step3Valid: boolean;
    total: number;
    btcRate: number;
    isProcessing: boolean;
    paymentSummaryLabel: string;
    handleSubmit: () => void;
}

/* Helper: get logo for a payment method */
function pmLogo(pm: PaymentMethod) {
    if (pm.type === "card") return pm.cardBrand === "mastercard" ? <MastercardLogo size={18} /> : <VisaLogo size={16} />;
    if (pm.type === "paypal") return <PayPalLogo size={18} />;
    if (pm.type === "usdt") return <USDTLogo size={16} />;
    return <BTCLogo size={16} />;
}

function pmDetailLabel(pm: PaymentMethod) {
    if (pm.type === "card") return `${pm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${pm.cardLast4} · Vence ${pm.cardExpiry}`;
    if (pm.type === "paypal") return pm.paypalEmail ?? "";
    return pm.cryptoNetwork ?? "";
}

export function PaymentStep({
    state, dispatch, user, step3Valid, total, btcRate, isProcessing,
    paymentSummaryLabel, handleSubmit,
}: PaymentStepProps) {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { step, selectedPmId, payMethod, payment, paypalEmail, savedCardCvv, pmDropdownOpen, copiedAddr } = state;

    const selectedPm: PaymentMethod | undefined = selectedPmId !== "new"
        ? user.paymentMethods.find((p) => p.id === selectedPmId)
        : undefined;

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            dispatch({ type: "PATCH", payload: { copiedAddr: true } });
            setTimeout(() => dispatch({ type: "PATCH", payload: { copiedAddr: false } }), 2000);
        });
    }

    return (
        <Section>
            <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => step > 2 && dispatch({ type: "SET_STEP", step: 3 })}
            >
                <StepBadge n={3} active={step === 3} done={false} />
                <div className="flex-1">
                    <p className="text-sm text-gray-900">{t("checkout.payment.title") || "Pago"}</p>
                    {step !== 3 && paymentSummaryLabel && (
                        <p className="text-xs text-gray-400 mt-0.5">{paymentSummaryLabel}</p>
                    )}
                </div>
                {step > 3 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
            </button>

            {step === 3 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                    {total === 0 ? (
                        /* ── Gift card / discounts cover the full amount ── */
                        <div className="pt-5 space-y-4">
                            <div className="flex items-center gap-3 px-4 py-4 bg-green-50/60 rounded-xl border border-green-100">
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <Gift className="w-4 h-4 text-green-600" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm text-green-800">{t("checkout.payment.fullyCovered") || "El total está completamente cubierto"}</p>
                                    <p className="text-xs text-green-600 mt-0.5">{t("checkout.payment.fullyCoveredSub") || "No se requiere método de pago adicional"}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className={`w-full inline-flex items-center justify-center gap-2 text-sm rounded-xl px-5 py-3.5 transition-colors ${isProcessing
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-gray-500 rounded-full animate-spin" />
                                        Procesando pedido…
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" strokeWidth={1.5} />
                                        Confirmar pedido · {formatPrice(0)}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="pt-5 space-y-3">

                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t("checkout.payment.method") || "Método de pago"}</p>

                            {/* ── Saved method dropdown ── */}
                            {user.paymentMethods.length > 0 && selectedPmId !== "new" && selectedPm && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: "PATCH", payload: { pmDropdownOpen: !pmDropdownOpen } })}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-400 transition-colors text-left"
                                        >
                                            <span className="flex-shrink-0">{pmLogo(selectedPm)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 truncate">{selectedPm.label}</p>
                                                <p className="text-xs text-gray-400 truncate">{pmDetailLabel(selectedPm)}</p>
                                            </div>
                                            {selectedPm.isDefault && (
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{t("checkout.payment.default") || "Predeterminado"}</span>
                                            )}
                                            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${pmDropdownOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                                        </button>

                                        {pmDropdownOpen && (
                                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                                                {user.paymentMethods.map((pm) => (
                                                    <button
                                                        key={pm.id}
                                                        type="button"
                                                        onClick={() => { dispatch({ type: "PATCH", payload: { selectedPmId: pm.id, savedCardCvv: "", pmDropdownOpen: false } }); }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${pm.id === selectedPmId ? "bg-gray-50" : ""}`}
                                                    >
                                                        <span className="flex-shrink-0">{pmLogo(pm)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900 truncate">{pm.label}</p>
                                                            <p className="text-xs text-gray-400 truncate">{pmDetailLabel(pm)}</p>
                                                        </div>
                                                        {pm.id === selectedPmId && <Check className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2} />}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => { dispatch({ type: "PATCH", payload: { selectedPmId: "new", pmDropdownOpen: false } }); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-gray-100 flex-shrink-0">
                                                        <Plus className="w-3 h-3 text-gray-500" strokeWidth={2} />
                                                    </div>
                                                    <p className="text-sm text-gray-600">{t("checkout.payment.useOther") || "Usar otro método de pago"}</p>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CVV for saved cards */}
                                    {selectedPm.type === "card" && (
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1.5">
                                                <Shield className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                                Confirma tu CVV para continuar
                                            </label>
                                            <div className="relative w-32">
                                                <input
                                                    type="password"
                                                    value={savedCardCvv}
                                                    onChange={(e) => dispatch({ type: "PATCH", payload: { savedCardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) } })}
                                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-gray-400 font-mono placeholder-gray-300"
                                                    placeholder="•••"
                                                    maxLength={4}
                                                />
                                                <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                        <Lock className="w-3 h-3" strokeWidth={1.5} />
                                        Pago 100% seguro con cifrado SSL de 256 bits
                                    </div>
                                </div>
                            )}

                            {/* ── New method form ── */}
                            {(selectedPmId === "new" || user.paymentMethods.length === 0) && (
                                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                    {user.paymentMethods.length > 0 && (
                                        <div className="px-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => { const def = user.paymentMethods.find(p => p.isDefault) ?? user.paymentMethods[0]; if (def) dispatch({ type: "PATCH", payload: { selectedPmId: def.id } }); }}
                                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-1"
                                            >
                                                <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                                                Volver a mis métodos guardados
                                            </button>
                                        </div>
                                    )}

                                    {selectedPmId === "new" && (
                                        <div className="border-t border-gray-100 bg-gray-50/50 px-4 pb-5">
                                            {/* Method type tabs */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mb-5">
                                                {([
                                                    { id: "card", logo: <div className="flex items-center gap-1.5"><VisaLogo size={16} /><MastercardLogo size={22} /></div>, label: "Tarjeta" },
                                                    { id: "paypal", logo: <PayPalLogo size={18} />, label: "PayPal" },
                                                    { id: "usdt", logo: <USDTLogo size={22} />, label: "USDT" },
                                                    { id: "btc", logo: <BTCLogo size={22} />, label: "Bitcoin" },
                                                ] as const).map(({ id, logo, label }) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => dispatch({ type: "PATCH", payload: { payMethod: id } })}
                                                        className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition-all ${payMethod === id ? "border-gray-500 bg-white" : "border-gray-200 bg-white hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <div className="h-6 flex items-center">{logo}</div>
                                                        <span className="text-[11px] text-gray-500">{label}</span>
                                                        {payMethod === id && (
                                                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gray-500 flex items-center justify-center">
                                                                <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* New card form */}
                                            {payMethod === "card" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-[11px] text-gray-400 flex-shrink-0">{t("checkout.payment.weAccept") || "Aceptamos:"}</span>
                                                        <VisaLogo size={18} />
                                                        <MastercardLogo size={22} />
                                                        <span className="ml-auto">
                                                            <Lock className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.cardNumber") || "Número de tarjeta"}</label>
                                                        <div className="relative w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-28 focus-within:border-gray-400 bg-white">
                                                            <CardNumberElement
                                                                onChange={(e: StripeElementChangeEvent) => dispatch({ type: "SET_STRIPE_COMPLETE", field: "number", complete: e.complete })}
                                                                options={{ style: { base: { fontSize: "14px", color: "#111827", fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em", "::placeholder": { color: "#d1d5db" } } } }}
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50">
                                                                <VisaLogo size={16} />
                                                                <MastercardLogo size={22} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.cardName") || "Nombre en la tarjeta"}</label>
                                                        <input
                                                            value={payment.cardName}
                                                            onChange={(e) => dispatch({ type: "SET_PAYMENT", payload: { cardName: e.target.value.toUpperCase() } })}
                                                            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 uppercase tracking-wider"
                                                            placeholder="FIRST LAST"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.expiry") || "Vencimiento"}</label>
                                                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-gray-400 bg-white">
                                                                <CardExpiryElement
                                                                    onChange={(e: StripeElementChangeEvent) => dispatch({ type: "SET_STRIPE_COMPLETE", field: "expiry", complete: e.complete })}
                                                                    options={{ style: { base: { fontSize: "14px", color: "#111827", fontFamily: "ui-monospace, monospace", "::placeholder": { color: "#d1d5db" } } } }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-400 mb-1.5">CVV</label>
                                                            <div className="relative w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus-within:border-gray-400 bg-white">
                                                                <CardCvcElement
                                                                    onChange={(e: StripeElementChangeEvent) => dispatch({ type: "SET_STRIPE_COMPLETE", field: "cvc", complete: e.complete })}
                                                                    options={{ style: { base: { fontSize: "14px", color: "#111827", fontFamily: "ui-monospace, monospace", "::placeholder": { color: "#d1d5db" } } } }}
                                                                />
                                                                <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" strokeWidth={1.5} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={state.saveNewPaymentMethod}
                                                            onChange={(e) => dispatch({
                                                                type: "PATCH",
                                                                payload: { saveNewPaymentMethod: e.target.checked }
                                                            })}
                                                            className="w-3.5 h-3.5 accent-gray-700 cursor-pointer"
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            Guardar esta tarjeta para compras futuras
                                                        </span>
                                                    </label>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                                                        <p className="text-xs text-gray-400">{t("checkout.payment.secureCard") || "Todos tus datos de pago están encriptados y seguros."}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ══ PayPal form ══ */}
                                            {payMethod === "paypal" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 px-4 py-3.5 bg-sky-50/40 rounded-xl border border-sky-100">
                                                        <PayPalLogo size={22} />
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            Serás redirigido a PayPal para completar tu pago de forma segura. No compartimos tus datos bancarios.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">
                                                            <Mail className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                                            Email de tu cuenta PayPal
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={paypalEmail}
                                                            onChange={(e) => dispatch({ type: "PATCH", payload: { paypalEmail: e.target.value } })}
                                                            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#179BD7]/60 placeholder-gray-300"
                                                            placeholder="your@paypal.com"
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={state.saveNewPaymentMethod}
                                                            onChange={(e) => dispatch({
                                                                type: "PATCH",
                                                                payload: { saveNewPaymentMethod: e.target.checked }
                                                            })}
                                                            className="w-3.5 h-3.5 accent-gray-700 cursor-pointer"
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            Guardar esta cuenta PayPal para compras futuras
                                                        </span>
                                                    </label>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Shield className="w-3.5 h-3.5 text-[#179BD7] flex-shrink-0" strokeWidth={1.5} />
                                                        <p className="text-xs text-gray-400">{t("checkout.payment.securePaypal") || "PayPal protege tus datos bancarios con cifrado de extremo a extremo."}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ══ USDT form ══ */}
                                            {payMethod === "usdt" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3 px-4 py-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
                                                        <USDTLogo size={20} />
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            Envía <span className="text-gray-800">exactamente</span> el importe indicado en USDT a la dirección de abajo. El pedido se procesará tras <span className="text-gray-800">1 confirmación</span> en red.
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.network") || "Red de pago"}</label>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {[
                                                                { label: "TRC-20 (TRON)", active: true },
                                                                { label: "ERC-20 (Ethereum)", active: false },
                                                                { label: "BEP-20 (BSC)", active: false },
                                                            ].map(({ label, active }) => (
                                                                <button
                                                                    key={label}
                                                                    type="button"
                                                                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${active
                                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                                        : "text-gray-400 border-gray-200 hover:border-gray-300"
                                                                        }`}
                                                                >
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-xs text-gray-400">{t("checkout.payment.exactAmount") || "Importe exacto a enviar"}</span>
                                                        <span className="text-sm text-gray-900 font-mono">{total.toFixed(2)} USDT</span>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.usdtAddress") || "Dirección de wallet USDT (TRC-20)"}</label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                                <span className="text-xs text-gray-700 font-mono truncate select-all">{MOCK_USDT_ADDRESS}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(MOCK_USDT_ADDRESS)}
                                                                className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border transition-all ${copiedAddr
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {copiedAddr ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                                                {copiedAddr ? "Copiado" : "Copiar"}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                        <p className="text-xs text-gray-400">
                                                            Envía únicamente <strong className="text-gray-600">USDT en red TRC-20</strong>. Envíos en otras redes o de otras monedas pueden perderse permanentemente.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ══ BTC form ══ */}
                                            {payMethod === "btc" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3 px-4 py-3.5 bg-orange-50/40 rounded-xl border border-orange-100">
                                                        <BTCLogo size={20} />
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            Envía <span className="text-gray-800">exactamente</span> el importe indicado en BTC a la dirección de abajo. El pedido se procesará tras <span className="text-gray-800">2 confirmaciones</span> en la blockchain.
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-xs text-gray-400">{t("checkout.payment.exactAmount") || "Importe exacto a enviar"}</span>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-900 font-mono">{(total / btcRate).toFixed(6)} BTC</p>
                                                            <p className="text-[11px] text-gray-400">≈ ${total.toFixed(2)} USD · 1 BTC ≈ ${btcRate.toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1.5">{t("checkout.payment.btcAddress") || "Dirección Bitcoin (Native SegWit · bc1q…)"}</label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                                <span className="text-xs text-gray-700 font-mono truncate select-all">{MOCK_BTC_ADDRESS}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(MOCK_BTC_ADDRESS)}
                                                                className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border transition-all ${copiedAddr
                                                                    ? "bg-orange-50 text-orange-600 border-orange-200"
                                                                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {copiedAddr ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                                                {copiedAddr ? "Copiado" : "Copiar"}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                        <p className="text-xs text-gray-400">
                                                            Envía únicamente <strong className="text-gray-600">Bitcoin (BTC)</strong> a esta dirección. No envíes BCH, BSV ni ninguna otra criptomoneda.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit button — color adapts to active method */}
                            {(() => {
                                const activePm = selectedPm;
                                const activeType = activePm ? activePm.type : payMethod;
                                const btnColor = !step3Valid || isProcessing
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : activeType === "paypal" ? "bg-[#179BD7] text-white hover:bg-[#1589be]"
                                        : activeType === "usdt" ? "bg-[#26A17B] text-white hover:bg-[#1e8a69]"
                                            : activeType === "btc" ? "bg-[#F7931A] text-white hover:bg-[#e07f0a]"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300";
                                const btnLabel = activePm
                                    ? activePm.type === "paypal" ? `Pagar con PayPal · ${formatPrice(total)}`
                                        : activePm.type === "usdt" ? `Confirmar pago · ${total.toFixed(2)} USDT`
                                            : activePm.type === "btc" ? `Confirmar pago · ${(total / btcRate).toFixed(6)} BTC`
                                                : `Confirmar pedido · ${formatPrice(total)}`
                                    : payMethod === "paypal" ? `Pagar con PayPal · ${formatPrice(total)}`
                                        : payMethod === "usdt" ? `Confirmar pago · ${total.toFixed(2)} USDT`
                                            : payMethod === "btc" ? `Confirmar pago · ${(total / btcRate).toFixed(6)} BTC`
                                                : `Confirmar pedido · ${formatPrice(total)}`;
                                return (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isProcessing || !step3Valid}
                                        className={`mt-4 w-full inline-flex items-center justify-center gap-2 text-sm rounded-xl px-5 py-3.5 transition-colors ${btnColor}`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Procesando pago…
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" strokeWidth={1.5} />
                                                {btnLabel}
                                            </>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}
        </Section>
    );
}
