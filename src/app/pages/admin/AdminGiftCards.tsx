import { useState, useEffect, useCallback } from "react";
import { Plus, Gift, Copy, Ban, Eye, DollarSign, Check, X, User, Mail, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  type GiftCard as ApiGiftCard, type GiftCardDesign, type GiftCardTransaction,
  adminGiftCardRepository as giftCardRepository,
} from "../../repositories/CmsRepository";

type GCStatus = "pending" | "active" | "used" | "expired" | "void";

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  status: GCStatus;
  createdAt: string;
  expiresAt: string;
  buyer?: string;
  recipient?: string;
  note?: string;
}

const STATUS_META: Record<GCStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pendiente", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  active: { label: "Activa", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  used: { label: "Usada", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300" },
  expired: { label: "Expirada", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  void: { label: "Anulada", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

// Removed: data is now loaded from the API.

function mapApiToUi(c: ApiGiftCard): GiftCard {
  let status: GCStatus;
  switch (c.status) {
    case "PENDING": status = "pending"; break;
    case "VOID": status = "void"; break;
    case "EXPIRED": status = "expired"; break;
    case "USED": status = "used"; break;
    default: status = "active";
  }
  return {
    id: c.id,
    code: c.code,
    amount: c.originalAmount ?? 0,
    balance: c.balance ?? 0,
    status,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-ES") : "",
    expiresAt: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("es-ES") : "",
    recipient: c.recipientEmail ?? c.recipientName ?? undefined,
    note: c.message ?? undefined,
  };
}

const AMOUNTS = [25, 50, 100, 150, 200, 500];

export function AdminGiftCards() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [designs, setDesigns] = useState<GiftCardDesign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ amount: 50, recipient: "", note: "" });
  const [detail, setDetail] = useState<{ card: GiftCard; txs: GiftCardTransaction[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCards = useCallback(async () => {
    try {
      const [page, designList] = await Promise.all([
        giftCardRepository.findAll({ size: 200 }),
        giftCardRepository.findAllDesigns(),
      ]);
      setCards(page.content.map(mapApiToUi));
      setDesigns(designList);
    } catch {
      toast.error("Error al cargar tarjetas regalo");
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleCreate = async () => {
    const designId = designs.find(d => d.active)?.id ?? designs[0]?.id;
    if (!designId) { toast.error("No hay diseños disponibles"); return; }
    try {
      const created = await giftCardRepository.purchase({
        designId,
        amount: form.amount,
        recipientEmail: form.recipient || undefined,
        message: form.note || undefined,
      });
      setCards(prev => [mapApiToUi(created), ...prev]);
      setShowCreate(false);
      setForm({ amount: 50, recipient: "", note: "" });
      toast.success(`Tarjeta regalo creada: ${created.code}`);
    } catch {
      toast.error("Error al crear tarjeta regalo");
    }
  };

  const voidCard = (id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, status: "void" as GCStatus } : c));
    toast.success("Tarjeta anulada");
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  const openDetail = async (card: GiftCard) => {
    setDetail({ card, txs: [] });
    setLoadingDetail(true);
    try {
      const txs = await giftCardRepository.findTransactions(card.id);
      setDetail({ card, txs });
    } catch {
      /* transactions optional */
    } finally {
      setLoadingDetail(false);
    }
  };

  const active = cards.filter(c => c.status === "active");
  const totalBal = active.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Tarjetas regalo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Crea y gestiona gift cards para tus clientes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva tarjeta regalo"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total emitidas", value: cards.length },
          { label: "Activas", value: active.length },
          { label: "Saldo pendiente", value: `$${totalBal}` },
          { label: "Valor emitido", value: `$${cards.reduce((s, c) => s + c.amount, 0)}` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Gift className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.8fr_80px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          {[
            { label: "Código", cls: "text-left" },
            { label: "Destinatario", cls: "text-left" },
            { label: "Valor", cls: "text-right" },
            { label: "Saldo", cls: "text-right" },
            { label: "Creada", cls: "text-center" },
            { label: "Vence", cls: "text-center" },
            { label: "Estado", cls: "text-left" },
            { label: "", cls: "text-right" },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        {cards.map((c, i) => {
          const sm = STATUS_META[c.status];
          return (
            <div
              key={c.id}
              className={`grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.8fr_80px] gap-3 px-4 py-3 items-center ${i !== cards.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {/* Código */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-gray-900 font-mono truncate">{c.code}</span>
                <button onClick={() => copy(c.code)} className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {/* Destinatario */}
              <p className="text-xs text-gray-500 truncate text-left">{c.recipient ?? c.buyer ?? "—"}</p>
              {/* Valor */}
              <p className="text-xs text-gray-900 text-right tabular-nums">${c.amount}</p>
              {/* Saldo */}
              <p className={`text-xs text-right tabular-nums ${c.balance === 0 ? "text-gray-400" : "text-gray-900"}`}>${c.balance}</p>
              {/* Creada */}
              <p className="text-xs text-gray-400 text-center">{c.createdAt}</p>
              {/* Vence */}
              <p className="text-xs text-gray-400 text-center">{c.expiresAt}</p>
              {/* Estado */}
              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                  {sm.label}
                </span>
              </div>
              {/* Acciones */}
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openDetail(c)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {c.status === "active" && (
                  <button
                    onClick={() => voidCard(c.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-6">
            <p className="text-sm text-gray-900 mb-5">Nueva tarjeta regalo</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Importe</label>
                <div className="flex flex-wrap gap-2">
                  {AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => setForm(f => ({ ...f, amount: a }))}
                      className={`h-8 px-4 text-xs rounded-lg border transition-colors ${form.amount === a
                        ? "bg-gray-600 text-white border-gray-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email destinatario (opcional)</label>
                <input
                  value={form.recipient}
                  onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                  placeholder="destinatario@email.com"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Nota interna</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Ej. Regalo cumpleaños…"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 h-8 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 h-8 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" /> Crear tarjeta ${form.amount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (() => {
        const c = detail.card;
        const sm = STATUS_META[c.status];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Detalle de tarjeta</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{c.code}</p>
                </div>
                <button onClick={() => setDetail(null)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Status + amounts */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${sm.bg} ${sm.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                  <div className="text-right">
                    <p className="text-lg text-gray-900 tabular-nums">${c.balance}</p>
                    <p className="text-[10px] text-gray-400">de ${c.amount} original</p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] text-gray-400">Destinatario</p>
                      <p className="text-xs text-gray-700">{c.recipient || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] text-gray-400">Creada</p>
                      <p className="text-xs text-gray-700">{c.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] text-gray-400">Vence</p>
                      <p className="text-xs text-gray-700">{c.expiresAt || "Sin vencimiento"}</p>
                    </div>
                  </div>
                  {c.note && (
                    <div className="flex items-start gap-2 col-span-2">
                      <Gift className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <div>
                        <p className="text-[10px] text-gray-400">Mensaje</p>
                        <p className="text-xs text-gray-700">{c.note}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transactions */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Transacciones</p>
                  {loadingDetail ? (
                    <p className="text-xs text-gray-400">Cargando…</p>
                  ) : detail.txs.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin transacciones</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {detail.txs.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-700">
                              {tx.type === "PURCHASE" ? "Compra" : tx.type === "REDEMPTION" ? "Canje" : "Reembolso"}
                            </p>
                            <p className="text-[10px] text-gray-400">{new Date(tx.createdAt).toLocaleDateString("es-ES")}</p>
                          </div>
                          <p className={`text-xs tabular-nums ${tx.type === "REDEMPTION" ? "text-red-500" : "text-green-600"}`}>
                            {tx.type === "REDEMPTION" ? "-" : "+"}${tx.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-2">
                <button
                  onClick={() => { copy(c.code); }}
                  className="w-full h-8 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar código
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}