import { useState } from "react";
import { Plus, Gift, Copy, Ban, Eye, DollarSign, Check } from "lucide-react";
import { toast } from "sonner";

type GCStatus = "active" | "used" | "expired" | "void";

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
  active:  { label: "Activa",   bg: "bg-green-50",  text: "text-green-700", dot: "bg-green-400"  },
  used:    { label: "Usada",    bg: "bg-gray-100",  text: "text-gray-500",  dot: "bg-gray-300"   },
  expired: { label: "Expirada", bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-400"  },
  void:    { label: "Anulada",  bg: "bg-red-50",    text: "text-red-600",   dot: "bg-red-400"    },
};

const initCards: GiftCard[] = [
  { id: "gc1", code: "NEXA-GFT-4A9K",  amount: 50,  balance: 50,   status: "active",  createdAt: "01/03/2026", expiresAt: "01/03/2027", buyer: "María García",  recipient: "info@juan.com",   note: "Regalo cumpleaños" },
  { id: "gc2", code: "NEXA-GFT-7H2M",  amount: 100, balance: 0,    status: "used",    createdAt: "15/02/2026", expiresAt: "15/02/2027", buyer: "Carlos López",  recipient: "laura@email.com" },
  { id: "gc3", code: "NEXA-GFT-3B8N",  amount: 25,  balance: 25,   status: "active",  createdAt: "10/03/2026", expiresAt: "10/03/2027", recipient: "ana@email.com" },
  { id: "gc4", code: "NEXA-GFT-9L5P",  amount: 200, balance: 80,   status: "active",  createdAt: "05/03/2026", expiresAt: "05/03/2027", buyer: "Sofía Torres",  note: "Promo 5 aniversario" },
  { id: "gc5", code: "NEXA-GFT-2Q1R",  amount: 50,  balance: 50,   status: "expired", createdAt: "01/01/2025", expiresAt: "01/01/2026" },
  { id: "gc6", code: "NEXA-GFT-6T4S",  amount: 75,  balance: 75,   status: "void",    createdAt: "20/02/2026", expiresAt: "20/02/2027", note: "Anulada por reclamación" },
];

const AMOUNTS = [25, 50, 100, 150, 200, 500];

export function AdminGiftCards() {
  const [cards, setCards] = useState<GiftCard[]>(initCards);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ amount: 50, recipient: "", note: "" });

  const handleCreate = () => {
    const code = `NEXA-GFT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const newCard: GiftCard = {
      id: `gc${Date.now()}`,
      code,
      amount: form.amount,
      balance: form.amount,
      status: "active",
      createdAt: new Date().toLocaleDateString("es-ES"),
      expiresAt: new Date(Date.now() + 365 * 86400000).toLocaleDateString("es-ES"),
      recipient: form.recipient || undefined,
      note: form.note || undefined,
    };
    setCards(prev => [newCard, ...prev]);
    setShowCreate(false);
    setForm({ amount: 50, recipient: "", note: "" });
    toast.success(`Tarjeta regalo creada: ${code}`);
  };

  const voidCard = (id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, status: "void" } : c));
    toast.success("Tarjeta anulada");
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  const active   = cards.filter(c => c.status === "active");
  const totalBal = active.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Tarjetas regalo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Crea y gestiona gift cards para tus clientes</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-8 px-4 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nueva tarjeta regalo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total emitidas",    value: cards.length          },
          { label: "Activas",           value: active.length         },
          { label: "Saldo pendiente",   value: `$${totalBal}`        },
          { label: "Valor emitido",     value: `$${cards.reduce((s, c) => s + c.amount, 0)}` },
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
        <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          {["Código", "Destinatario", "Valor", "Saldo", "Creada", "Vence", "Estado", ""].map(h => (
            <p key={h} className="text-[10px] text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {cards.map((c, i) => {
          const sm = STATUS_META[c.status];
          return (
            <div key={c.id} className={`grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 px-4 py-3 items-center ${i !== cards.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-900 font-mono">{c.code}</span>
                <button onClick={() => copy(c.code)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500 truncate">{c.recipient ?? c.buyer ?? "—"}</p>
              <p className="text-sm text-gray-900">${c.amount}</p>
              <p className={`text-sm ${c.balance === 0 ? "text-gray-400" : "text-gray-900"}`}>${c.balance}</p>
              <p className="text-xs text-gray-400">{c.createdAt}</p>
              <p className="text-xs text-gray-400">{c.expiresAt}</p>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                {sm.label}
              </span>
              <div className="flex gap-1">
                <button onClick={() => toast.info("Ver detalle")} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Eye className="w-3 h-3" /></button>
                {c.status === "active" && (
                  <button onClick={() => voidCard(c.id)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Ban className="w-3 h-3" /></button>
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
                    <button key={a} onClick={() => setForm(f => ({ ...f, amount: a }))}
                      className={`h-8 px-4 text-xs rounded-lg border transition-colors ${form.amount === a ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email destinatario (opcional)</label>
                <input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="destinatario@email.com"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Nota interna</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Ej. Regalo cumpleaños…"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-8 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleCreate} className="flex-1 h-8 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> Crear tarjeta ${form.amount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
