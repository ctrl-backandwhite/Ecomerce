import { useState, useEffect } from "react";
import { giftCardRepository } from "../repositories/GiftCardRepository";
import {
  Gift, Mail, Check, ChevronRight, ChevronLeft, ChevronDown,
  User, MessageSquare, Calendar, CreditCard,
  Lock, Sparkles, ArrowRight, Copy, Download,
  Clock, Send, X, Plus, Shield, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  GIFT_CARD_DESIGNS,
  GIFT_CARD_AMOUNTS,
  type GiftCardDesign,
} from "../types/giftcard";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import type { PaymentMethod } from "../context/UserContext";
import {
  VisaLogo, MastercardLogo, PayPalLogo, USDTLogo, BTCLogo,
} from "../components/PaymentLogos";

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface FormState {
  design: GiftCardDesign;
  amount: number;
  customAmount: string;
  toName: string;
  toEmail: string;
  fromName: string;
  message: string;
  sendNow: boolean;
  scheduledDate: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolder: string;
}

// ── GiftCard visual component ─────────────────────────────────────────────────
function GiftCardVisual({
  design,
  amount,
  toName,
  fromName,
  message,
  code,
  size = "lg",
}: {
  design: GiftCardDesign;
  amount: number;
  toName?: string;
  fromName?: string;
  message?: string;
  code?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { w: "w-48", h: "h-28", pad: "p-3", txt: "text-xs", amt: "text-xl" },
    md: { w: "w-72", h: "h-44", pad: "p-4", txt: "text-xs", amt: "text-2xl" },
    lg: { w: "w-full max-w-sm", h: "h-52", pad: "p-6", txt: "text-sm", amt: "text-3xl" },
  }[size];

  return (
    <div
      className={`${dims.w} ${dims.h} rounded-2xl ${dims.pad} flex flex-col justify-between select-none relative overflow-hidden shadow-xl`}
      style={{ background: `linear-gradient(135deg, ${design.from}, ${design.to})` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-4 text-6xl" style={{ color: design.accent }}>
          {design.emoji}
        </div>
        <div className="absolute bottom-2 left-4 text-4xl opacity-40" style={{ color: design.accent }}>
          {design.emoji}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5" style={{ color: design.accent }}>
          {design.emoji}
        </div>
      </div>

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className={`${dims.txt} tracking-widest uppercase`} style={{ color: design.accent, opacity: 0.7 }}>
            NX036 Gift Card
          </p>
          {toName && (
            <p className={`${dims.txt} mt-0.5`} style={{ color: design.accent, opacity: 0.9 }}>
              Para {toName}
            </p>
          )}
        </div>
        <span className={`${dims.txt} text-lg`} style={{ color: design.accent }}>{design.emoji}</span>
      </div>

      {/* Amount */}
      <div className="relative z-10 text-center">
        <p className={`${dims.amt} tracking-tight`} style={{ color: design.accent }}>
          {amount > 0 ? `${amount}€` : "_ _ €"}
        </p>
        {fromName && (
          <p className={`${dims.txt} mt-1 opacity-70`} style={{ color: design.accent }}>
            De {fromName}
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="relative z-10 flex items-end justify-between">
        {code ? (
          <p className="text-[10px] tracking-widest font-mono" style={{ color: design.accent, opacity: 0.8 }}>
            {code}
          </p>
        ) : (
          <p className="text-[10px] tracking-widest font-mono" style={{ color: design.accent, opacity: 0.4 }}>
            NX036-XXXX-XXXX
          </p>
        )}
        <p className={`${dims.txt} opacity-60`} style={{ color: design.accent }}>
          nx036.com
        </p>
      </div>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Diseño" },
    { n: 2, label: "Personalizar" },
    { n: 3, label: "Pago" },
    { n: 4, label: "Listo" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${step > s.n ? "bg-gray-600 text-white" :
              step === s.n ? "bg-gray-600 text-white ring-4 ring-gray-200" :
                "bg-gray-100 text-gray-400"
              }`}>
              {step > s.n ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.n}
            </div>
            <p className={`text-[10px] whitespace-nowrap ${step === s.n ? "text-gray-900" : "text-gray-400"}`}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-px mb-4 mx-1 ${step > s.n ? "bg-gray-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────
const inp = "w-full h-9 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-500 transition-colors placeholder:text-gray-300";
const lbl = "block text-xs text-gray-500 mb-1.5";

// ── Main page ─────────────────────────────────────────────────────────────────
export function GiftCardPurchase() {
  const { isAuthenticated, login } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState<Step>(1);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<FormState>({
    design: GIFT_CARD_DESIGNS[0],
    amount: 50,
    customAmount: "",
    toName: "",
    toEmail: "",
    fromName: "",
    message: "",
    sendNow: true,
    scheduledDate: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardHolder: "",
  });

  /* --- Saved payment methods --- */
  const hasSavedMethods = isAuthenticated && user.paymentMethods.length > 0;
  const defaultPm = user.paymentMethods.find(p => p.isDefault) ?? user.paymentMethods[0] ?? null;
  const [selectedPmId, setSelectedPmId] = useState<string | "new">(defaultPm?.id ?? "new");
  const [savedCardCvv, setSavedCardCvv] = useState("");
  const [pmDropdownOpen, setPmDropdownOpen] = useState(false);

  const selectedPm: PaymentMethod | undefined = selectedPmId !== "new"
    ? user.paymentMethods.find(p => p.id === selectedPmId)
    : undefined;

  // Sync default when paymentMethods load async
  useEffect(() => {
    if (hasSavedMethods && selectedPmId === "new") {
      const def = user.paymentMethods.find(p => p.isDefault) ?? user.paymentMethods[0];
      if (def) setSelectedPmId(def.id);
    }
  }, [user.paymentMethods, hasSavedMethods]);

  // Helper: get logo for a payment method
  function pmLogo(pm: PaymentMethod) {
    if (pm.type === "card") return pm.cardBrand === "mastercard" ? <MastercardLogo size={18} /> : <VisaLogo size={16} />;
    if (pm.type === "paypal") return <PayPalLogo size={18} />;
    if (pm.type === "usdt") return <USDTLogo size={16} />;
    return <BTCLogo size={16} />;
  }
  function pmDetail(pm: PaymentMethod) {
    if (pm.type === "card") return `${pm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${pm.cardLast4} · Vence ${pm.cardExpiry}`;
    if (pm.type === "paypal") return pm.paypalEmail ?? "";
    return pm.cryptoNetwork ?? "";
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const effectiveAmount = form.customAmount
    ? parseInt(form.customAmount) || 0
    : form.amount;

  // Validate step 2
  const step2Valid =
    form.toName.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.toEmail) &&
    form.fromName.trim() !== "";

  // Validate step 3
  const step3Valid = selectedPmId !== "new"
    ? selectedPm?.type === "card" ? savedCardCvv.length >= 3 : true
    : form.cardHolder.trim() !== "" &&
    form.cardNumber.replace(/\s/g, "").length === 16 &&
    form.cardExpiry.length === 5 &&
    form.cardCvv.length === 3;

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    v = v.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  }

  async function handlePay() {
    if (!step3Valid) { toast.error("Completa los datos de pago"); return; }
    try {
      const result = await giftCardRepository.purchase({
        designId: form.design.id,
        amount: effectiveAmount,
        recipientName: form.toName,
        recipientEmail: form.toEmail,
        message: form.message || undefined,
        sendDate: !form.sendNow && form.scheduledDate
          ? form.scheduledDate.slice(0, 10)
          : undefined,
      });
      setGeneratedCode(result.code);
      setStep(4);
      toast.success("¡Pago completado! Tarjeta enviada correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el pago");
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(generatedCode).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Código copiado");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back link — top left */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Seguir comprando
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-4">
            <Gift className="w-3.5 h-3.5" strokeWidth={1.5} />
            El regalo perfecto para cualquier ocasión
          </div>
          <h1 className="text-3xl sm:text-4xl tracking-tight text-gray-900 mb-3">
            Tarjetas de regalo NX036
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Sorprende a alguien especial con una tarjeta regalo enviada directamente a su email. Lista en segundos.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <StepBar step={step} />

        {/* ── STEP 1: Diseño y valor ──────────────────────────────── */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: config */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg text-gray-900 mb-4">Elige el diseño</h2>
                <div className="grid grid-cols-3 gap-2">
                  {GIFT_CARD_DESIGNS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => set("design", d)}
                      className={`relative rounded-xl overflow-hidden aspect-[3/2] transition-all ${form.design.id === d.id
                        ? "ring-2 ring-gray-900 ring-offset-2 scale-[1.02]"
                        : "ring-1 ring-gray-200 hover:ring-gray-400"
                        }`}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }}
                      >
                        <span className="text-2xl opacity-70">{d.emoji}</span>
                      </div>
                      <p className="absolute bottom-0 inset-x-0 text-[9px] text-center py-0.5 bg-black/30 text-white">
                        {d.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg text-gray-900 mb-3">Elige el importe</h2>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {GIFT_CARD_AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => { set("amount", a); set("customAmount", ""); }}
                      className={`h-11 rounded-xl text-sm border transition-all ${form.amount === a && !form.customAmount
                        ? "bg-gray-600 text-white border-gray-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-500"
                        }`}
                    >
                      {a}€
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    className={`${inp} pl-7`}
                    placeholder="Importe personalizado (5–500€)"
                    value={form.customAmount}
                    onChange={e => { set("customAmount", e.target.value); set("amount", 0); }}
                  />
                </div>
                {effectiveAmount > 0 && effectiveAmount < 5 && (
                  <p className="text-xs text-red-500 mt-1">El importe mínimo es 5€</p>
                )}
              </div>

              <button
                disabled={effectiveAmount < 5}
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2 w-full h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continuar — {effectiveAmount > 0 ? `${effectiveAmount}€` : "Elige un importe"}
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Right: live preview */}
            <div className="flex flex-col items-center gap-4 sticky top-24">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Vista previa</p>
              <GiftCardVisual
                design={form.design}
                amount={effectiveAmount}
                toName={form.toName || undefined}
                fromName={form.fromName || undefined}
                size="lg"
              />
              <div className="w-full max-w-sm bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                  Válida 12 meses desde la compra
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                  Canjeable en toda la tienda NX036
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                  Envío instantáneo al email del destinatario
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Personalización ─────────────────────────────── */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <h2 className="text-lg text-gray-900">Personaliza la tarjeta</h2>

              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Para quién es</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Nombre del destinatario *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                      <input
                        className={`${inp} pl-9`}
                        placeholder="María García"
                        value={form.toName}
                        onChange={e => set("toName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Email del destinatario *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                      <input
                        type="email"
                        className={`${inp} pl-9`}
                        placeholder="maria@email.com"
                        value={form.toEmail}
                        onChange={e => set("toEmail", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">De parte de</p>
                <div>
                  <label className={lbl}>Tu nombre *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                    <input
                      className={`${inp} pl-9`}
                      placeholder="Tu nombre"
                      value={form.fromName}
                      onChange={e => set("fromName", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Mensaje personal <span className="text-gray-300">(opcional)</span></label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                    <textarea
                      rows={3}
                      maxLength={200}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-500 transition-colors placeholder:text-gray-300 resize-none"
                      placeholder="Escribe un mensaje para acompañar la tarjeta…"
                      value={form.message}
                      onChange={e => set("message", e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">{form.message.length}/200</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">¿Cuándo enviar?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => set("sendNow", true)}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${form.sendNow ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                  >
                    <Send className={`w-4 h-4 ${form.sendNow ? "" : "text-gray-300"}`} strokeWidth={1.5} />
                    Ahora mismo
                  </button>
                  <button
                    type="button"
                    onClick={() => set("sendNow", false)}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${!form.sendNow ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                  >
                    <Calendar className={`w-4 h-4 ${!form.sendNow ? "" : "text-gray-300"}`} strokeWidth={1.5} />
                    Programar
                  </button>
                </div>
                {!form.sendNow && (
                  <div>
                    <label className={lbl}>Fecha y hora de envío</label>
                    <input
                      type="datetime-local"
                      className={inp}
                      value={form.scheduledDate}
                      onChange={e => set("scheduledDate", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 h-11 px-5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Volver
                </button>
                <button
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar al pago
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Right: preview */}
            <div className="flex flex-col items-center gap-4 sticky top-24">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Vista previa</p>
              <GiftCardVisual
                design={form.design}
                amount={effectiveAmount}
                toName={form.toName || undefined}
                fromName={form.fromName || undefined}
                size="lg"
              />
              {form.message && (
                <div className="w-full max-w-sm bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Mensaje</p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{form.message}"</p>
                  <p className="text-xs text-gray-400 mt-2">— {form.fromName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Pago ────────────────────────────────────────── */}
        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <h2 className="text-lg text-gray-900">Datos de pago</h2>

              {/* Order summary */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Resumen del pedido</p>
                <div className="flex items-center gap-3 mb-4">
                  <GiftCardVisual
                    design={form.design}
                    amount={effectiveAmount}
                    toName={form.toName}
                    fromName={form.fromName}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm text-gray-900">{form.design.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Para: {form.toName}</p>
                    <p className="text-xs text-gray-400">{form.toEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.sendNow ? "Envío inmediato" : `Envío programado: ${form.scheduledDate.replace("T", " ")}`}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tarjeta regalo</span>
                    <span className="text-gray-900">{effectiveAmount}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envío por email</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{effectiveAmount}€</span>
                  </div>
                </div>
              </div>

              {/* Login prompt when not authenticated */}
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => login("/gift-cards")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Inicia sesión para usar tus métodos guardados</p>
                    <p className="text-xs text-gray-400">Accede a tus tarjetas, PayPal y criptomonedas</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                </button>
              )}

              {/* Payment method selector */}
              <div className="bg-white border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider px-5 pt-5 pb-3">Método de pago</p>

                {/* ── Saved method selector (dropdown) ── */}
                {hasSavedMethods && selectedPmId !== "new" && selectedPm && (
                  <div className="px-5 pb-4 space-y-3">
                    {/* Selected method display + dropdown trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPmDropdownOpen(prev => !prev)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-400 transition-colors text-left"
                      >
                        <span className="flex-shrink-0">{pmLogo(selectedPm)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{selectedPm.label}</p>
                          <p className="text-xs text-gray-400 truncate">{pmDetail(selectedPm)}</p>
                        </div>
                        {selectedPm.isDefault && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">Predeterminado</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${pmDropdownOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                      </button>

                      {/* Dropdown list */}
                      {pmDropdownOpen && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                          {user.paymentMethods.map((pm) => (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => { setSelectedPmId(pm.id); setSavedCardCvv(""); setPmDropdownOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${pm.id === selectedPmId ? "bg-gray-50" : ""}`}
                            >
                              <span className="flex-shrink-0">{pmLogo(pm)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">{pm.label}</p>
                                <p className="text-xs text-gray-400 truncate">{pmDetail(pm)}</p>
                              </div>
                              {pm.id === selectedPmId && <Check className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2} />}
                            </button>
                          ))}
                          {/* Option to add new card */}
                          <button
                            type="button"
                            onClick={() => { setSelectedPmId("new"); setPmDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-gray-100 flex-shrink-0">
                              <Plus className="w-3 h-3 text-gray-500" strokeWidth={2} />
                            </div>
                            <p className="text-sm text-gray-600">Usar otra tarjeta</p>
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
                            onChange={(e) => setSavedCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
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

                {/* ── New card form ── */}
                {(selectedPmId === "new" || !hasSavedMethods) && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Link back to saved methods */}
                    {hasSavedMethods && (
                      <button
                        type="button"
                        onClick={() => { const def = user.paymentMethods.find(p => p.isDefault) ?? user.paymentMethods[0]; if (def) setSelectedPmId(def.id); }}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                        Volver a mis métodos guardados
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Tarjeta de crédito / débito</p>
                      <div className="flex items-center gap-2">
                        <VisaLogo size={16} />
                        <MastercardLogo size={20} />
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>Titular de la tarjeta</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                        <input
                          className={`${inp} pl-9 uppercase`}
                          placeholder="NOMBRE APELLIDO"
                          value={form.cardHolder}
                          onChange={e => set("cardHolder", e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>Número de tarjeta</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                        <input
                          className={`${inp} pl-9 font-mono tracking-widest`}
                          placeholder="1234 5678 9012 3456"
                          value={form.cardNumber}
                          onChange={e => set("cardNumber", formatCard(e.target.value))}
                          maxLength={19}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Caducidad</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                          <input
                            className={`${inp} pl-9`}
                            placeholder="MM/AA"
                            value={form.cardExpiry}
                            onChange={e => set("cardExpiry", formatExpiry(e.target.value))}
                            maxLength={5}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>CVV</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                          <input
                            type="password"
                            className={`${inp} pl-9`}
                            placeholder="•••"
                            value={form.cardCvv}
                            onChange={e => set("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                      <Lock className="w-3 h-3" strokeWidth={1.5} />
                      Pago 100% seguro con cifrado SSL de 256 bits
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 h-11 px-5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Volver
                </button>
                <button
                  disabled={!step3Valid}
                  onClick={handlePay}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Lock className="w-4 h-4" strokeWidth={1.5} />
                  Pagar {effectiveAmount}€
                </button>
              </div>
            </div>

            {/* Right: mini preview */}
            <div className="flex flex-col items-center gap-4 sticky top-24">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Tu tarjeta</p>
              <GiftCardVisual
                design={form.design}
                amount={effectiveAmount}
                toName={form.toName}
                fromName={form.fromName}
                size="lg"
              />
              <div className="w-full max-w-sm space-y-2">
                {[
                  { icon: Mail, label: `Enviada a ${form.toEmail}` },
                  { icon: Clock, label: form.sendNow ? "Entrega inmediata" : "Entrega programada" },
                  { icon: Gift, label: "Válida 12 meses" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs text-gray-500">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3 h-3" strokeWidth={1.5} />
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Confirmación ─────────────────────────────────── */}
        {step === 4 && (
          <div className="max-w-lg mx-auto text-center">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" strokeWidth={2} />
            </div>
            <h2 className="text-2xl tracking-tight text-gray-900 mb-2">
              ¡Tarjeta enviada con éxito!
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              {form.toName} recibirá la tarjeta regalo en <strong>{form.toEmail}</strong>
              {form.sendNow ? " en los próximos minutos." : "."}
            </p>

            {/* Gift card */}
            <div className="flex justify-center mb-6">
              <GiftCardVisual
                design={form.design}
                amount={effectiveAmount}
                toName={form.toName}
                fromName={form.fromName}
                code={generatedCode}
                size="lg"
              />
            </div>

            {/* Code */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Código de la tarjeta</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-mono tracking-widest text-gray-900">{generatedCode}</span>
                <button
                  onClick={copyCode}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-left mb-8 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">¿Qué pasa ahora?</p>
              {[
                { icon: Mail, text: `${form.toName} recibirá un email con la tarjeta y el código` },
                { icon: Gift, text: "Podrá activarla en su perfil de NX036 y usarla en cualquier compra" },
                { icon: Clock, text: "La tarjeta es válida durante 12 meses desde hoy" },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setStep(1); setSavedCardCvv(""); setForm(prev => ({ ...prev, toName: "", toEmail: "", message: "", cardNumber: "", cardExpiry: "", cardCvv: "", cardHolder: "" })); }}
                className="flex-1 flex items-center justify-center gap-2 h-11 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Gift className="w-4 h-4" strokeWidth={1.5} />
                Enviar otra tarjeta
              </button>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Ir a la tienda
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Features footer strip */}
      {step < 4 && (
        <div className="border-t border-gray-200 bg-white mt-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid sm:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "6 diseños exclusivos", desc: "Elige el que mejor encaje con la ocasión" },
              { icon: Send, title: "Envío instantáneo", desc: "El destinatario lo recibe en su email al instante" },
              { icon: Gift, title: "Validez 12 meses", desc: "Sin prisas, tiempo de sobra para disfrutarla" },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-gray-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}