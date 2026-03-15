import { useState } from "react";
import { useUser, type PaymentMethod, type PayMethodType } from "../../context/UserContext";
import {
  VisaLogo, MastercardLogo, PayPalLogo, USDTLogo, BTCLogo,
} from "../PaymentLogos";
import {
  Plus, Check, Trash2, Star, X, CreditCard,
  ChevronDown, Shield, AlertCircle, Mail, Copy,
} from "lucide-react";
import { toast } from "sonner";

/* ── Helpers ─────────────────────────────────────────────── */
const MOCK_USDT_ADDRESS = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
const MOCK_BTC_ADDRESS  = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

function pmIcon(pm: PaymentMethod, size = 20) {
  if (pm.type === "card") {
    return pm.cardBrand === "mastercard"
      ? <MastercardLogo className="h-5 w-auto" />
      : <VisaLogo className="h-4 w-auto" />;
  }
  if (pm.type === "paypal")  return <PayPalLogo className="h-4 w-auto" />;
  if (pm.type === "usdt")    return <USDTLogo size={size} />;
  if (pm.type === "btc")     return <BTCLogo size={size} />;
  return <CreditCard className="w-4 h-4 text-gray-400" strokeWidth={1.5} />;
}

function pmAccentColors(type: PayMethodType) {
  if (type === "paypal")  return { border: "border-[#179BD7]", bg: "bg-sky-50/40",     badge: "bg-sky-100 text-sky-700"     };
  if (type === "usdt")    return { border: "border-[#26A17B]", bg: "bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" };
  if (type === "btc")     return { border: "border-[#F7931A]", bg: "bg-orange-50/40",  badge: "bg-orange-100 text-orange-700"  };
  return { border: "border-gray-200", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-600" };
}

/* ── Sub-form to add a new method ────────────────────────── */
type FormTab = "card" | "paypal" | "usdt" | "btc";

interface AddFormProps {
  onSave: (pm: Omit<PaymentMethod, "id">) => void;
  onCancel: () => void;
}

function AddPaymentForm({ onSave, onCancel }: AddFormProps) {
  const [tab, setTab] = useState<FormTab>("card");

  /* Card fields */
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName]     = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv]       = useState("");
  const [cardLabel, setCardLabel]   = useState("My Card");
  const [cardBrand, setCardBrand]   = useState<"visa" | "mastercard">("visa");

  /* PayPal */
  const [ppEmail, setPpEmail]   = useState("");
  const [ppLabel, setPpLabel]   = useState("My PayPal");

  /* USDT */
  const [usdtLabel, setUsdtLabel] = useState("USDT Wallet");

  /* BTC */
  const [btcLabel, setBtcLabel] = useState("Bitcoin Wallet");

  const [setAsDefault, setSetAsDefault] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyAddr(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function detectBrand(num: string): "visa" | "mastercard" {
    return num.startsWith("5") || num.startsWith("2") ? "mastercard" : "visa";
  }

  function handleSave() {
    if (tab === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast.error("Completa todos los campos de la tarjeta");
        return;
      }
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      onSave({
        type: "card", label: cardLabel, isDefault: setAsDefault,
        cardBrand, cardLast4: last4, cardName: cardName.toUpperCase(), cardExpiry,
      });
    } else if (tab === "paypal") {
      if (!ppEmail) { toast.error("Introduce el email de PayPal"); return; }
      onSave({ type: "paypal", label: ppLabel, isDefault: setAsDefault, paypalEmail: ppEmail });
    } else if (tab === "usdt") {
      onSave({
        type: "usdt", label: usdtLabel, isDefault: setAsDefault,
        cryptoNetwork: "TRC-20", cryptoAddress: MOCK_USDT_ADDRESS,
      });
    } else {
      onSave({
        type: "btc", label: btcLabel, isDefault: setAsDefault,
        cryptoNetwork: "Native SegWit", cryptoAddress: MOCK_BTC_ADDRESS,
      });
    }
  }

  const tabDefs: { id: FormTab; label: string; logo: React.ReactNode }[] = [
    { id: "card",   label: "Tarjeta",  logo: <div className="flex items-center gap-1.5"><VisaLogo className="h-3.5 w-auto" /><MastercardLogo className="h-4 w-auto" /></div> },
    { id: "paypal", label: "PayPal",   logo: <PayPalLogo className="h-4 w-auto" /> },
    { id: "usdt",   label: "USDT",     logo: <USDTLogo size={18} /> },
    { id: "btc",    label: "Bitcoin",  logo: <BTCLogo size={18} /> },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
        <p className="text-sm text-gray-900">Agregar método de pago</p>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Method tabs */}
        <div className="grid grid-cols-4 gap-2">
          {tabDefs.map(({ id, label, logo }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs transition-all ${
                tab === id
                  ? "border-gray-900 bg-white text-gray-900"
                  : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
              }`}
            >
              <div className="h-5 flex items-center">{logo}</div>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Card form ── */}
        {tab === "card" && (
          <div className="space-y-3">
            {/* Brand selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Red de tarjeta</label>
              <div className="flex gap-2">
                {(["visa", "mastercard"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCardBrand(b)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      cardBrand === b ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {b === "visa" ? <VisaLogo className="h-3.5 w-auto" /> : <MastercardLogo className="h-5 w-auto" />}
                    <span className="text-xs text-gray-600 capitalize">{b}</span>
                    {cardBrand === b && <Check className="w-3 h-3 text-gray-900 ml-1" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Etiqueta (nombre para identificar)</label>
              <input
                value={cardLabel}
                onChange={(e) => setCardLabel(e.target.value)}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                placeholder="Ej: Mi Visa personal"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Número de tarjeta</label>
              <div className="relative">
                <input
                  value={cardNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                    const fmt = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
                    setCardNumber(fmt);
                    setCardBrand(detectBrand(raw));
                  }}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 pr-24 focus:outline-none focus:border-gray-400 font-mono tracking-widest placeholder-gray-300"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <VisaLogo className="h-3 w-auto opacity-40" />
                  <MastercardLogo className="h-4 w-auto opacity-40" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nombre en la tarjeta</label>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 uppercase tracking-wider placeholder-gray-300"
                placeholder="FIRST LAST"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Vencimiento</label>
                <input
                  value={cardExpiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                    setCardExpiry(v);
                  }}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 font-mono placeholder-gray-300"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">CVV</label>
                <div className="relative">
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-gray-400 font-mono placeholder-gray-300"
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                  />
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PayPal form ── */}
        {tab === "paypal" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-sky-50/40 rounded-xl border border-sky-100">
              <PayPalLogo className="h-5 w-auto flex-shrink-0" />
              <p className="text-xs text-gray-500">Vincula tu cuenta PayPal para pagar rápidamente en futuros pedidos.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Etiqueta</label>
              <input
                value={ppLabel}
                onChange={(e) => setPpLabel(e.target.value)}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                placeholder="Ej: Mi PayPal personal"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                <Mail className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                Email de tu cuenta PayPal
              </label>
              <input
                type="email"
                value={ppEmail}
                onChange={(e) => setPpEmail(e.target.value)}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#179BD7]/50 placeholder-gray-300"
                placeholder="your@paypal.com"
              />
            </div>
          </div>
        )}

        {/* ── USDT form ── */}
        {tab === "usdt" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <USDTLogo size={18} />
              <p className="text-xs text-gray-500 leading-relaxed">
                Agrega USDT como método de pago. La dirección de wallet se mostrará en el checkout para que realices la transferencia.
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Etiqueta</label>
              <input
                value={usdtLabel}
                onChange={(e) => setUsdtLabel(e.target.value)}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                placeholder="Ej: Mi wallet USDT"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Red</label>
              <div className="flex gap-2">
                {["TRC-20 (TRON)", "ERC-20 (Ethereum)", "BEP-20 (BSC)"].map((n, i) => (
                  <button key={n} type="button" className={`text-[11px] px-3 py-1.5 rounded-full border ${i === 0 ? "bg-emerald-600 text-white border-emerald-600" : "text-gray-400 border-gray-200"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Dirección de destino (TRC-20)</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <span className="text-xs text-gray-700 font-mono truncate">{MOCK_USDT_ADDRESS}</span>
                </div>
                <button type="button" onClick={() => copyAddr(MOCK_USDT_ADDRESS)}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2.5 rounded-lg border transition-all ${copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                  {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  {copied ? "OK" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BTC form ── */}
        {tab === "btc" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 px-4 py-3 bg-orange-50/40 rounded-xl border border-orange-100">
              <BTCLogo size={18} />
              <p className="text-xs text-gray-500 leading-relaxed">
                Agrega Bitcoin como método de pago. La dirección de wallet se mostrará en el checkout para que realices la transferencia.
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Etiqueta</label>
              <input
                value={btcLabel}
                onChange={(e) => setBtcLabel(e.target.value)}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                placeholder="Ej: Mi wallet Bitcoin"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Dirección de destino (Native SegWit)</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <span className="text-xs text-gray-700 font-mono truncate">{MOCK_BTC_ADDRESS}</span>
                </div>
                <button type="button" onClick={() => copyAddr(MOCK_BTC_ADDRESS)}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2.5 rounded-lg border transition-all ${copied ? "bg-orange-50 text-orange-600 border-orange-200" : "text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                  {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  {copied ? "OK" : "Copiar"}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-gray-400">Envía solo <strong className="text-gray-600">BTC</strong> a esta dirección. Otros activos se perderán.</p>
            </div>
          </div>
        )}

        {/* Set as default + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setSetAsDefault(!setAsDefault)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                setAsDefault ? "bg-gray-500 border-gray-500" : "border-gray-300"
              }`}
            >
              {setAsDefault && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </button>
            <span className="text-xs text-gray-600">Establecer como método predeterminado</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors"
            >
              Guardar método
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function ProfilePagos() {
  const { user, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleAdd(pm: Omit<PaymentMethod, "id">) {
    addPaymentMethod(pm);
    setShowForm(false);
    toast.success("Método de pago guardado");
  }

  function handleRemove(id: string) {
    removePaymentMethod(id);
    toast.success("Método eliminado");
  }

  function handleSetDefault(id: string) {
    setDefaultPaymentMethod(id);
    toast.success("Método predeterminado actualizado");
  }

  function cardTypeLabel(pm: PaymentMethod) {
    if (pm.type === "card")   return `${pm.cardBrand === "mastercard" ? "Mastercard" : "Visa"} ···· ${pm.cardLast4}`;
    if (pm.type === "paypal") return pm.paypalEmail ?? "PayPal";
    if (pm.type === "usdt")   return `USDT · ${pm.cryptoNetwork}`;
    if (pm.type === "btc")    return `Bitcoin · ${pm.cryptoNetwork}`;
    return "";
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base text-gray-900">Métodos de pago</h2>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona tus tarjetas y billeteras guardadas</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Agregar método
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <AddPaymentForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* Empty state */}
      {user.paymentMethods.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-xl">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-gray-600 mb-1">No tienes métodos de pago guardados</p>
          <p className="text-xs text-gray-400 mb-5">Agrega una tarjeta, PayPal, USDT o Bitcoin</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Agregar primer método
          </button>
        </div>
      )}

      {/* List */}
      {user.paymentMethods.length > 0 && (
        <div className="space-y-3">
          {user.paymentMethods.map((pm) => {
            const accent = pmAccentColors(pm.type);
            const isExpanded = expandedId === pm.id;
            return (
              <div
                key={pm.id}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                  pm.isDefault ? accent.border : "border-gray-100"
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Logo */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    pm.type === "card" ? "bg-gray-50 border border-gray-100"
                    : pm.type === "paypal" ? "bg-sky-50"
                    : pm.type === "usdt"   ? "bg-emerald-50"
                    : "bg-orange-50"
                  }`}>
                    {pmIcon(pm, 22)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-900">{pm.label}</p>
                      {pm.isDefault && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${accent.badge}`}>
                          Predeterminado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{cardTypeLabel(pm)}</p>
                    {pm.type === "card" && pm.cardExpiry && (
                      <p className="text-[11px] text-gray-400">Vence {pm.cardExpiry}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!pm.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(pm.id)}
                        title="Establecer como predeterminado"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Star className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : pm.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(pm.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className={`px-5 pb-4 pt-1 border-t border-gray-50 ${accent.bg}`}>
                    {pm.type === "card" && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                        <div><span className="text-gray-400">Titular</span><p className="text-gray-700 mt-0.5">{pm.cardName}</p></div>
                        <div><span className="text-gray-400">Últimos 4 dígitos</span><p className="text-gray-700 font-mono mt-0.5">···· {pm.cardLast4}</p></div>
                        <div><span className="text-gray-400">Vencimiento</span><p className="text-gray-700 font-mono mt-0.5">{pm.cardExpiry}</p></div>
                        <div><span className="text-gray-400">Red</span><p className="text-gray-700 mt-0.5 capitalize">{pm.cardBrand}</p></div>
                      </div>
                    )}
                    {pm.type === "paypal" && (
                      <div className="text-xs">
                        <span className="text-gray-400">Email vinculado</span>
                        <p className="text-gray-700 mt-0.5">{pm.paypalEmail}</p>
                      </div>
                    )}
                    {(pm.type === "usdt" || pm.type === "btc") && (
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-gray-400">Red</span><p className="text-gray-700 mt-0.5">{pm.cryptoNetwork}</p></div>
                        <div>
                          <span className="text-gray-400">Dirección de destino</span>
                          <p className="text-gray-700 font-mono mt-0.5 break-all">{pm.cryptoAddress}</p>
                        </div>
                      </div>
                    )}
                    {!pm.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(pm.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Star className="w-3 h-3" strokeWidth={1.5} />
                        Establecer como predeterminado
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 mt-2">
        <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-gray-400 leading-relaxed">
          Tu información de pago está protegida. Los datos de tarjetas se almacenan de forma tokenizada y nunca se guardan en texto plano.
        </p>
      </div>
    </div>
  );
}