import { useState, useMemo, useEffect } from "react";
import {
  Search, X, Eye, Check, XCircle, RefreshCcw,
  AlertTriangle, Clock, Package, DollarSign,
  ChevronRight, Truck, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";

/* ── Types ─────────────────────────────────────────────────── */
type ReturnStatus = "requested" | "reviewing" | "approved" | "rejected" | "refunded";
type ReturnReason = "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "damaged" | "other";

interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customer: { name: string; email: string };
  productName: string;
  productSku: string;
  quantity: number;
  amount: number;
  reason: ReturnReason;
  reasonDetail: string;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
  refundMethod: "original" | "credit" | "exchange";
}

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_RETURNS: ReturnRequest[] = [
  { id:"rt1", returnNumber:"RET-001", orderNumber:"ORD-2024-003", customer:{name:"Pedro Sánchez",email:"pedro@email.com"}, productName:"Samsung Galaxy S24 Ultra", productSku:"SAM-S24U-256BLK", quantity:1, amount:1349, reason:"defective", reasonDetail:"La pantalla parpadea intermitentemente desde el segundo día de uso.", status:"reviewing", createdAt:"2026-03-10", updatedAt:"2026-03-11", refundMethod:"original" },
  { id:"rt2", returnNumber:"RET-002", orderNumber:"ORD-2024-007", customer:{name:"Laura González",email:"laura@email.com"}, productName:"Nike Air Max 270", productSku:"NK-AM270-42BLK", quantity:1, amount:149, reason:"wrong_item", reasonDetail:"Recibí talla 42 pero pedí talla 43.", status:"approved", createdAt:"2026-03-08", updatedAt:"2026-03-09", refundMethod:"exchange" },
  { id:"rt3", returnNumber:"RET-003", orderNumber:"ORD-2024-012", customer:{name:"Carlos Martín",email:"carlos@email.com"}, productName:"Sony WH-1000XM5", productSku:"SNY-WH1000XM5-BLK", quantity:1, amount:379, reason:"not_as_described", reasonDetail:"La cancelación de ruido no es tan efectiva como se describe.", status:"requested", createdAt:"2026-03-12", updatedAt:"2026-03-12", refundMethod:"original" },
  { id:"rt4", returnNumber:"RET-004", orderNumber:"ORD-2024-015", customer:{name:"Ana Ruiz",email:"ana@email.com"}, productName:"Canon EOS R10", productSku:"CAN-EOSR10-KIT", quantity:1, amount:899, reason:"changed_mind", reasonDetail:"Decidí comprar un modelo más avanzado.", status:"rejected", createdAt:"2026-03-05", updatedAt:"2026-03-06", refundMethod:"credit" },
  { id:"rt5", returnNumber:"RET-005", orderNumber:"ORD-2024-019", customer:{name:"Miguel Torres",email:"miguel@email.com"}, productName:"JBL Charge 5", productSku:"JBL-CHG5-BLU", quantity:2, amount:298, reason:"damaged", reasonDetail:"El producto llegó con la caja golpeada y el altavoz con rayaduras.", status:"refunded", createdAt:"2026-03-01", updatedAt:"2026-03-04", refundMethod:"original" },
  { id:"rt6", returnNumber:"RET-006", orderNumber:"ORD-2024-022", customer:{name:"Sofía López",email:"sofia@email.com"}, productName:"Apple iPhone 15 Pro Max", productSku:"APL-IP15PM-256BLK", quantity:1, amount:1499, reason:"defective", reasonDetail:"El botón de acción no responde correctamente.", status:"reviewing", createdAt:"2026-03-09", updatedAt:"2026-03-10", refundMethod:"original" },
  { id:"rt7", returnNumber:"RET-007", orderNumber:"ORD-2024-028", customer:{name:"David Fernández",email:"david@email.com"}, productName:"Logitech MX Master 3", productSku:"LOG-MXM3-GRY", quantity:1, amount:109, reason:"defective", reasonDetail:"El scroll horizontal deja de funcionar después de una semana.", status:"approved", createdAt:"2026-03-07", updatedAt:"2026-03-08", refundMethod:"exchange" },
  { id:"rt8", returnNumber:"RET-008", orderNumber:"ORD-2024-031", customer:{name:"Elena Moreno",email:"elena@email.com"}, productName:"Adidas Ultraboost 23", productSku:"ADI-UB23-42WHT", quantity:1, amount:189, reason:"not_as_described", reasonDetail:"El color real es diferente al de las fotos del producto.", status:"requested", createdAt:"2026-03-13", updatedAt:"2026-03-13", refundMethod:"original" },
  { id:"rt9", returnNumber:"RET-009", orderNumber:"ORD-2024-035", customer:{name:"Roberto Gil",email:"roberto@email.com"}, productName:"GoPro HERO12 Black", productSku:"GP-HERO12-STD", quantity:1, amount:449, reason:"other", reasonDetail:"No cumple con mis necesidades de grabación submarina.", status:"refunded", createdAt:"2026-02-25", updatedAt:"2026-03-01", refundMethod:"credit" },
  { id:"rt10",returnNumber:"RET-010", orderNumber:"ORD-2024-040", customer:{name:"Isabel Castro",email:"isabel@email.com"}, productName:"Dell XPS 15 (2024)", productSku:"DELL-XPS15-I7-32", quantity:1, amount:1899, reason:"defective", reasonDetail:"La batería no carga más del 80% desde el día 1.", status:"requested", createdAt:"2026-03-13", updatedAt:"2026-03-13", refundMethod:"original" },
];

/* ── Meta ──────────────────────────────────────────────────── */
const STATUS_META: Record<ReturnStatus, { label: string; bg: string; text: string; dot: string }> = {
  requested: { label: "Solicitada",  bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  reviewing: { label: "Revisando",   bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  approved:  { label: "Aprobada",    bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  rejected:  { label: "Rechazada",   bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400"    },
  refunded:  { label: "Reembolsada", bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400"  },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  defective:        "Producto defectuoso",
  wrong_item:       "Producto incorrecto",
  not_as_described: "No coincide con descripción",
  changed_mind:     "Cambio de opinión",
  damaged:          "Llegó dañado",
  other:            "Otro motivo",
};

const REFUND_LABELS: Record<string, string> = {
  original: "Método original",
  credit:   "Crédito en tienda",
  exchange: "Cambio de producto",
};

const STATUS_FLOW: ReturnStatus[] = ["requested", "reviewing", "approved", "refunded"];

/* ── Detail drawer ─────────────────────────────────────────── */
function ReturnDrawer({
  ret, onClose, onStatusChange,
}: {
  ret: ReturnRequest;
  onClose: () => void;
  onStatusChange: (id: string, s: ReturnStatus) => void;
}) {
  const sm = STATUS_META[ret.status];
  const currentIdx = STATUS_FLOW.indexOf(ret.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm text-gray-900 font-mono">{ret.returnNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">Orden {ret.orderNumber}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${sm.bg} ${sm.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
              {sm.label}
            </span>
            <p className="text-xs text-gray-400">{new Date(ret.createdAt).toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}</p>
          </div>

          {/* Progress */}
          {ret.status !== "rejected" && (
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((s, idx) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] border ${
                    idx <= currentIdx ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-300"
                  }`}>{idx + 1}</div>
                  <div className={`flex-1 h-px ${idx < currentIdx ? "bg-gray-900" : "bg-gray-100"}`} />
                </div>
              ))}
            </div>
          )}

          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
            <p className="text-sm text-gray-900">{ret.customer.name}</p>
            <p className="text-xs text-gray-500">{ret.customer.email}</p>
          </div>

          {/* Product */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Producto</p>
            <p className="text-sm text-gray-900">{ret.productName}</p>
            <p className="text-xs text-gray-400 font-mono">{ret.productSku}</p>
            <p className="text-xs text-gray-500">Cantidad: {ret.quantity}</p>
          </div>

          {/* Return details */}
          <div className="space-y-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Detalles de devolución</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">Motivo</p>
                <p className="text-xs text-gray-700">{REASON_LABELS[ret.reason]}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">Reembolso vía</p>
                <p className="text-xs text-gray-700">{REFUND_LABELS[ret.refundMethod]}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1.5">Descripción del cliente</p>
              <p className="text-xs text-gray-600 leading-relaxed">{ret.reasonDetail}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gray-900 text-white rounded-xl p-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Monto a reembolsar</p>
            <p className="text-xl tracking-tight">${ret.amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Actions footer */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-2 flex-shrink-0">
          {ret.status === "requested" && (
            <button onClick={() => { onStatusChange(ret.id, "reviewing"); onClose(); }}
              className="w-full h-8 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Iniciar revisión
            </button>
          )}
          {ret.status === "reviewing" && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { onStatusChange(ret.id, "rejected"); onClose(); }}
                className="h-8 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Rechazar
              </button>
              <button onClick={() => { onStatusChange(ret.id, "approved"); onClose(); }}
                className="h-8 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Aprobar
              </button>
            </div>
          )}
          {ret.status === "approved" && (
            <button onClick={() => { onStatusChange(ret.id, "refunded"); onClose(); }}
              className="w-full h-8 text-xs text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <DollarSign className="w-3.5 h-3.5" /> Procesar reembolso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export function AdminReturns() {
  const [returns, setReturns]   = useState<ReturnRequest[]>(MOCK_RETURNS);
  const [search, setSearch]     = useState("");
  const [statusF, setStatusF]   = useState<"all" | ReturnStatus>("all");
  const [drawer,  setDrawer]      = useState<ReturnRequest | null>(null);
  const [page, setPage]           = useState(1);
  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return returns.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (q && !r.returnNumber.toLowerCase().includes(q) &&
          !r.customer.name.toLowerCase().includes(q) &&
          !r.productName.toLowerCase().includes(q) &&
          !r.orderNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [returns, search, statusF]);

  const stats = useMemo(() => ({
    total:     returns.length,
    pending:   returns.filter(r => r.status === "requested" || r.status === "reviewing").length,
    approved:  returns.filter(r => r.status === "approved").length,
    refunded:  returns.filter(r => r.status === "refunded").reduce((s, r) => s + r.amount, 0),
  }), [returns]);

  function handleStatusChange(id: string, status: ReturnStatus) {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString().slice(0,10) } : r));
    const labels: Record<ReturnStatus, string> = {
      requested: "Marcada como solicitada",
      reviewing: "Revisión iniciada",
      approved:  "Devolución aprobada",
      rejected:  "Devolución rechazada",
      refunded:  "Reembolso procesado",
    };
    toast.success(labels[status]);
    if (drawer?.id === id) setDrawer(prev => prev ? { ...prev, status } : null);
  }

  useEffect(() => setPage(1), [search, statusF]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Devoluciones</h1>
          <p className="text-xs text-gray-400 mt-0.5">{returns.length} solicitudes en total</p>
        </div>
        {stats.pending > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {stats.pending} pendiente{stats.pending !== 1 ? "s" : ""} de gestión
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total solicitudes",   value: returns.length,  icon: RotateCcw,    color: "text-gray-700"   },
          { label: "Pendientes",          value: stats.pending,   icon: Clock,        color: "text-amber-600"  },
          { label: "Aprobadas",           value: stats.approved,  icon: Check,        color: "text-violet-600" },
          { label: "Total reembolsado",   value: `$${stats.refunded.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            className="w-full h-7 pl-8 pr-7 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
            placeholder="Buscar por nº devolución, cliente o producto…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"><X className="w-3 h-3" /></button>}
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="all">Todos los estados</option>
          <option value="requested">Solicitadas</option>
          <option value="reviewing">En revisión</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="refunded">Reembolsadas</option>
        </select>
        <span className="text-xs text-gray-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-[1fr_1.6fr_1.8fr_1fr_1fr_0.9fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {[
            { label: "Nº",       cls: "text-left"  },
            { label: "Cliente",  cls: "text-left"  },
            { label: "Producto", cls: "text-left"  },
            { label: "Motivo",   cls: "text-left"  },
            { label: "Importe",  cls: "text-right" },
            { label: "Estado",   cls: "text-left"  },
            { label: "",         cls: "text-right" },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        <div className="overflow-auto flex-1">
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <RotateCcw className="w-8 h-8 text-gray-200 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-gray-400">No se encontraron solicitudes</p>
            </div>
          )}

          {paginated.map((r, i) => {
            const sm = STATUS_META[r.status];
            return (
              <div key={r.id}
                className={`grid grid-cols-[1fr_1.6fr_1.8fr_1fr_1fr_0.9fr_auto] gap-3 px-4 py-3 items-center hover:bg-gray-50/60 transition-colors cursor-pointer ${i !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}
                onClick={() => setDrawer(r)}
              >
                <div>
                  <p className="text-xs text-gray-900 font-mono">{r.returnNumber}</p>
                  <p className="text-[11px] text-gray-400">{r.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-900 truncate">{r.customer.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{r.customer.email}</p>
                </div>
                <p className="text-xs text-gray-600 truncate">{r.productName}</p>
                <p className="text-xs text-gray-500 truncate">{REASON_LABELS[r.reason]}</p>
                <p className="text-xs text-gray-900 text-right tabular-nums">${r.amount.toLocaleString()}</p>
                <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                  {sm.label}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </div>
            );
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {drawer && (
        <ReturnDrawer
          ret={drawer}
          onClose={() => setDrawer(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}