import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, X, Eye, Check, XCircle, RefreshCcw,
  AlertTriangle, Clock, Package, DollarSign,
  ChevronRight, Truck, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import {
  returnRepository,
  type Return as ApiReturn,
  type ReturnStatus as ApiReturnStatus,
} from "../../repositories/ReturnRepository";

/* ── Types ─────────────────────────────────────────────────── */
type ReturnStatus = "requested" | "reviewing" | "approved" | "rejected" | "returned" | "refunded";

interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  orderId: string;
  userId: string;
  productName: string;
  quantity: number;
  amount: number;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── API ↔ UI mappers ─────────────────────────────────────── */
const API_TO_UI_STATUS: Record<ApiReturnStatus, ReturnStatus> = {
  REQUESTED: "requested",
  REVIEWING: "reviewing",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
  REFUNDED: "refunded",
};

const UI_TO_API_STATUS: Record<ReturnStatus, ApiReturnStatus> = {
  requested: "REQUESTED",
  reviewing: "REVIEWING",
  approved: "APPROVED",
  rejected: "REJECTED",
  returned: "RETURNED",
  refunded: "REFUNDED",
};

function mapApiToUi(r: ApiReturn): ReturnRequest {
  const firstItem = r.items?.[0];
  const totalQty = r.items?.reduce((sum, it) => sum + (it.quantity ?? 1), 0) ?? 0;
  return {
    id: r.id,
    returnNumber: `RET-${r.id.slice(-6).toUpperCase()}`,
    orderNumber: r.orderNumber ?? r.orderId,
    orderId: r.orderId,
    userId: r.userId,
    productName: firstItem?.name ?? "Producto",
    quantity: totalQty,
    amount: r.refundAmount ?? 0,
    reason: r.reason,
    status: API_TO_UI_STATUS[r.status] ?? "requested",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? r.createdAt,
  };
}

/* ── Meta ──────────────────────────────────────────────────── */
const STATUS_META: Record<ReturnStatus, { label: string; bg: string; text: string; dot: string }> = {
  requested: { label: "Solicitada", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  reviewing: { label: "Revisando", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  approved: { label: "Aprobada", bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  rejected: { label: "Rechazada", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  returned: { label: "Devuelto", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  refunded: { label: "Reembolsada", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
};

const STATUS_FLOW: ReturnStatus[] = ["requested", "reviewing", "approved", "returned", "refunded"];

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
            <p className="text-xs text-gray-400">{new Date(ret.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>

          {/* Progress */}
          {ret.status !== "rejected" && (
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((s, idx) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] border ${idx <= currentIdx ? "bg-gray-600 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-300"
                    }`}>{idx + 1}</div>
                  <div className={`flex-1 h-px ${idx < currentIdx ? "bg-gray-600" : "bg-gray-100"}`} />
                </div>
              ))}
            </div>
          )}

          {/* User */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Usuario</p>
            <p className="text-sm text-gray-900">{ret.userId}</p>
          </div>

          {/* Product */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Producto</p>
            <p className="text-sm text-gray-900">{ret.productName}</p>
            <p className="text-xs text-gray-500">Cantidad: {ret.quantity}</p>
          </div>

          {/* Return details */}
          <div className="space-y-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Detalles de devolución</p>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1.5">Motivo</p>
              <p className="text-xs text-gray-600 leading-relaxed">{ret.reason}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gray-700 text-white rounded-xl p-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Monto a reembolsar</p>
            <p className="text-xl tracking-tight">${ret.amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Actions footer */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-2 flex-shrink-0">
          {ret.status === "requested" && (
            <button onClick={() => { onStatusChange(ret.id, "reviewing"); onClose(); }}
              className="w-full h-8 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
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
                className="h-8 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-1.5">
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
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<"all" | ReturnStatus>("all");
  const [drawer, setDrawer] = useState<ReturnRequest | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadReturns = useCallback(async () => {
    try {
      const res = await returnRepository.findAll({ size: 200 });
      const items = Array.isArray(res) ? res : (res as any).content ?? [];
      setReturns(items.map(mapApiToUi));
    } catch { toast.error("Error al cargar las devoluciones"); }
  }, []);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return returns.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (q && !r.returnNumber.toLowerCase().includes(q) &&
        !r.userId.toLowerCase().includes(q) &&
        !r.productName.toLowerCase().includes(q) &&
        !r.orderNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [returns, search, statusF]);

  const stats = useMemo(() => ({
    total: returns.length,
    pending: returns.filter(r => r.status === "requested" || r.status === "reviewing").length,
    approved: returns.filter(r => r.status === "approved").length,
    refunded: returns.filter(r => r.status === "refunded").reduce((s, r) => s + r.amount, 0),
  }), [returns]);

  async function handleStatusChange(id: string, status: ReturnStatus) {
    try {
      await returnRepository.updateStatus(id, UI_TO_API_STATUS[status]);
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r));
      const labels: Record<ReturnStatus, string> = {
        requested: "Marcada como solicitada",
        reviewing: "Revisión iniciada",
        approved: "Devolución aprobada",
        rejected: "Devolución rechazada",
        returned: "Producto devuelto",
        refunded: "Reembolso procesado",
      };
      toast.success(labels[status]);
      if (drawer?.id === id) setDrawer(prev => prev ? { ...prev, status } : null);
    } catch { toast.error("Error al cambiar el estado"); }
  }

  useEffect(() => setPage(1), [search, statusF]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          { label: "Total solicitudes", value: returns.length, icon: RotateCcw, color: "text-gray-700" },
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Aprobadas", value: stats.approved, icon: Check, color: "text-violet-600" },
          { label: "Total reembolsado", value: `$${stats.refunded.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
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
            placeholder="Buscar por nº devolución, usuario o producto…"
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
          <option value="returned">Devueltas</option>
          <option value="refunded">Reembolsadas</option>
        </select>
        <span className="text-xs text-gray-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-[1fr_1.6fr_1.8fr_1fr_1fr_0.9fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {[
            { label: "Nº", cls: "text-left" },
            { label: "Usuario", cls: "text-left" },
            { label: "Producto", cls: "text-left" },
            { label: "Motivo", cls: "text-left" },
            { label: "Importe", cls: "text-right" },
            { label: "Estado", cls: "text-left" },
            { label: "", cls: "text-right" },
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
                  <p className="text-xs text-gray-900 truncate">{r.userId}</p>
                </div>
                <p className="text-xs text-gray-600 truncate">{r.productName}</p>
                <p className="text-xs text-gray-500 truncate">{r.reason}</p>
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