import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Gift, Plus, Copy, ArrowRight, Clock,
  Mail, Send, Eye, EyeOff, AlertTriangle, Sparkles,
  Tag, X, ChevronRight, Loader,
} from "lucide-react";
import { toast } from "sonner";
import {
  GIFT_CARD_DESIGNS,
  type ReceivedGiftCard,
  type SentGiftCard,
  type GCStatus,
} from "../../types/giftcard";
import {
  giftCardRepository,
  toReceivedGiftCard,
  toSentGiftCard,
} from "../../repositories/GiftCardRepository";

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDesign(id: string) {
  return GIFT_CARD_DESIGNS.find(d => d.id === id) ?? GIFT_CARD_DESIGNS[0];
}

function durationFromNow(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  const expiry = new Date(y, m - 1, d);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
  if (days < 0) return "Expirada";
  if (days === 0) return "Expira hoy";
  if (days < 30) return `${days} día${days !== 1 ? "s" : ""}`;
  const months = Math.ceil(days / 30);
  return `${months} mes${months !== 1 ? "es" : ""}`;
}

const STATUS_SENT: Record<string, { label: string; dot: string; text: string }> = {
  delivered: { label: "Entregada", dot: "bg-blue-400", text: "text-blue-600" },
  pending: { label: "Pendiente", dot: "bg-amber-400", text: "text-amber-600" },
  redeemed: { label: "Canjeada", dot: "bg-green-400", text: "text-green-600" },
};
const STATUS_RECEIVED: Record<GCStatus, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: "Activa", dot: "bg-green-400", text: "text-green-700", bg: "bg-green-50" },
  used: { label: "Agotada", dot: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-100" },
  expired: { label: "Expirada", dot: "bg-red-300", text: "text-red-500", bg: "bg-red-50" },
};

// ── Mini card visual ─────────────────────────────────────────────────────────
function MiniCard({ designId, amount, label }: { designId: string; amount: number; label?: string }) {
  const design = getDesign(designId);
  return (
    <div
      className="w-20 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 flex-shrink-0 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${design.from}, ${design.to})` }}
    >
      <span className="text-[10px] tracking-widest" style={{ color: design.accent }}>{design.emoji}</span>
      <span className="text-sm" style={{ color: design.accent }}>
        {label ?? `${amount}€`}
      </span>
    </div>
  );
}

// ── Activate dialog ─────────────────────────────────────────────────────────
function ActivateModal({ onClose, onActivate }: {
  onClose: () => void;
  onActivate: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [activating, setActivating] = useState(false);

  const formatted = code.replace(/[^A-Z0-9]/gi, "").toUpperCase()
    .replace(/(.{4})(?=.)/g, "$1-").slice(0, 14);

  async function handleActivate() {
    const clean = code.replace(/\s/g, "").toUpperCase();
    if (clean.length < 8) { setError("El código debe tener al menos 8 caracteres"); return; }
    setError("");
    setActivating(true);
    try {
      await onActivate(clean);
    } catch {
      setError("Código no válido o tarjeta no encontrada");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-500 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900">Activar tarjeta regalo</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Introduce el código que encontrarás en el email de tu tarjeta regalo. Formato: <span className="font-mono text-gray-700">GC-XXXXXXXX</span>
        </p>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Código de la tarjeta</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            <input
              type={show ? "text" : "password"}
              className="w-full h-10 pl-9 pr-10 text-sm font-mono tracking-widest border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-500 transition-colors placeholder:text-gray-300 placeholder:tracking-normal"
              placeholder="GC-XXXXXXXX"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleActivate()}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} disabled={activating} className="flex-1 h-9 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
            Cancelar
          </button>
          <button
            onClick={handleActivate}
            disabled={!code.trim() || activating}
            className="flex-1 h-9 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            {activating
              ? <Loader className="w-3.5 h-3.5 animate-spin" />
              : <Tag className="w-3.5 h-3.5" />}
            {activating ? "Verificando..." : "Activar tarjeta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Received card component ──────────────────────────────────────────────────
function ReceivedCard({ card, onCopy }: { card: ReceivedGiftCard; onCopy: (code: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_RECEIVED[card.status];
  const design = getDesign(card.designId);
  const percentUsed = Math.round(((card.originalAmount - card.balance) / card.originalAmount) * 100);
  const expiry = durationFromNow(card.expiryDate);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${card.status === "active" ? "border-gray-100" : "border-gray-100 opacity-70"}`}>
      <div className="flex items-start gap-4 p-4">
        {/* Card visual */}
        <div
          className="w-20 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 flex-shrink-0 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${design.from}, ${design.to})` }}
        >
          <span className="text-sm" style={{ color: design.accent }}>{design.emoji}</span>
          <span className="text-sm" style={{ color: design.accent }}>{card.balance}€</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-900">De {card.fromName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{card.fromEmail}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>

          {card.status === "active" && (
            <div className="mt-2">
              {/* Balance bar */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span>Saldo: <strong className="text-gray-900">{card.balance}€</strong> de {card.originalAmount}€</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
                  {expiry}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${100 - percentUsed}%`,
                    background: `linear-gradient(90deg, ${design.from}, ${design.to})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code row */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <span className="text-[11px] font-mono text-gray-500 tracking-widest">{card.code}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopy(card.code)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded transition-colors"
            title="Copiar código"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5 ml-1"
          >
            {expanded ? "Menos" : "Ver detalles"}
            <ChevronRight className={`w-2.5 h-2.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-50 space-y-2">
          {card.message && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Mensaje</p>
              <p className="text-xs text-gray-600 italic">"{card.message}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400">Recibida el</p>
              <p className="text-xs text-gray-700">{card.receivedDate}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Válida hasta</p>
              <p className="text-xs text-gray-700">{card.expiryDate}</p>
            </div>
          </div>
          {card.status === "active" && card.balance > 0 && (
            <Link
              to="/checkout"
              className="flex items-center gap-1.5 text-xs text-gray-900 mt-2 hover:underline"
            >
              Usar en mi próxima compra <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sent card component ───────────────────────────────────────────────────────
function SentCard({ card, onCopy }: { card: SentGiftCard; onCopy: (code: string) => void }) {
  const st = STATUS_SENT[card.status];
  const design = getDesign(card.designId);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <MiniCard designId={card.designId} amount={card.amount} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-900">Para {card.toName}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-2.5 h-2.5" strokeWidth={1.5} />
                {card.toEmail}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 bg-gray-50 ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-900">{card.amount}€</span>
            <span className="text-[10px] text-gray-400">Enviada el {card.sentDate}</span>
          </div>
          {card.message && (
            <p className="text-[10px] text-gray-400 mt-1 italic truncate">"{card.message}"</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <span className="text-[11px] font-mono text-gray-400 tracking-widest">{card.code}</span>
        <button
          onClick={() => onCopy(card.code)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ProfileGiftCards() {
  const [receivedCards, setReceivedCards] = useState<ReceivedGiftCard[]>([]);
  const [sentCards, setSentCards] = useState<SentGiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivate, setShowActivate] = useState(false);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([
      giftCardRepository.getMyReceived(),
      giftCardRepository.getMySent(),
    ]).then(([receivedResult, sentResult]) => {
      if (cancelled) return;
      if (receivedResult.status === "fulfilled") {
        setReceivedCards(receivedResult.value.map(toReceivedGiftCard));
      }
      if (sentResult.status === "fulfilled") {
        setSentCards(sentResult.value.map(toSentGiftCard));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const totalBalance = receivedCards.filter(c => c.status === "active").reduce((s, c) => s + c.balance, 0);
  const activeCount = receivedCards.filter(c => c.status === "active").length;

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).catch(() => { });
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
    toast.success("Código copiado");
  }

  async function handleActivate(code: string) {
    const clean = code.replace(/\s/g, "").toUpperCase();
    try {
      const card = await giftCardRepository.claimByCode(clean);
      if (card.status !== "ACTIVE") {
        toast.error("Esta tarjeta ya no está activa");
        return;
      }
      const mapped = toReceivedGiftCard(card);
      const alreadyAdded = receivedCards.some(c => c.id === mapped.id);
      if (alreadyAdded) {
        toast.info("Esta tarjeta ya está en tu lista");
      } else {
        setReceivedCards(prev => [mapped, ...prev]);
        toast.success(`Tarjeta activada — Saldo de ${card.balance}€ disponible`);
      }
      setShowActivate(false);
    } catch {
      toast.error("Código no válido o tarjeta no encontrada");
    }
  }

  return (
    <div className="space-y-5">

      {/* Balance summary */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111827, #374151)" }}
      >
        <div className="absolute top-3 right-6 text-5xl opacity-10">✦</div>
        <div className="absolute bottom-2 left-6 text-3xl opacity-5">✦</div>
        <p className="text-[11px] tracking-widest uppercase text-white/60 mb-1">Saldo disponible en tarjetas</p>
        <p className="text-4xl tracking-tight mb-3">{totalBalance}€</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Gift className="w-3.5 h-3.5" strokeWidth={1.5} />
            {activeCount} tarjeta{activeCount !== 1 ? "s" : ""} activa{activeCount !== 1 ? "s" : ""}
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            {sentCards.length} enviada{sentCards.length !== 1 ? "s" : ""}
          </div>
        </div>
        {totalBalance > 0 && (
          <Link
            to="/checkout"
            className="absolute right-5 bottom-5 flex items-center gap-1.5 text-[11px] text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors"
          >
            Usar saldo <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowActivate(true)}
          className="flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          <Tag className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          Activar tarjeta
        </button>
        <Link
          to="/tarjetas-regalo"
          className="flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Comprar y enviar
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 h-8 text-xs rounded-lg transition-colors ${activeTab === "received" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Recibidas ({receivedCards.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 h-8 text-xs rounded-lg transition-colors ${activeTab === "sent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Enviadas ({sentCards.length})
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white border border-gray-100 rounded-xl">
          <Loader className="w-5 h-5 text-gray-300 animate-spin" strokeWidth={1.5} />
        </div>
      ) : (
        <>
          {/* Received cards */}
          {activeTab === "received" && (
            <div className="space-y-3">
              {receivedCards.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-100 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-gray-300" strokeWidth={1} />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Sin tarjetas recibidas</p>
                  <p className="text-xs text-gray-400">¿Tienes un código? Actívalo con el botón de arriba</p>
                </div>
              ) : (
                receivedCards.map(c => (
                  <ReceivedCard key={c.id} card={c} onCopy={handleCopy} />
                ))
              )}
            </div>
          )}

          {/* Sent cards */}
          {activeTab === "sent" && (
            <div className="space-y-3">
              {sentCards.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-100 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Send className="w-6 h-6 text-gray-300" strokeWidth={1} />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Aún no has enviado ninguna tarjeta</p>
                  <Link to="/tarjetas-regalo" className="text-xs text-gray-900 underline">Enviar mi primera tarjeta regalo</Link>
                </div>
              ) : (
                sentCards.map(c => (
                  <SentCard key={c.id} card={c} onCopy={handleCopy} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Promo */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl p-4">
        <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-900">¿Conoces a alguien que merece un regalo especial?</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Envía una tarjeta NX036 directamente a su email</p>
        </div>
        <Link
          to="/tarjetas-regalo"
          className="flex items-center gap-1 text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          Regalar <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Modals */}
      {showActivate && (
        <ActivateModal
          onClose={() => setShowActivate(false)}
          onActivate={handleActivate}
        />
      )}
    </div>
  );
}