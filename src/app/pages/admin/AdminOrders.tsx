import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, X, Eye, Filter, ChevronDown, Check, Truck,
  Clock, CheckCircle2, XCircle, ArrowUpDown, Calendar, Package,
  ShoppingCart, DollarSign,
} from "lucide-react";
import { type AdminOrder, type OrderStatus, orderRepository } from "../../repositories/OrderRepository";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";

type Order = AdminOrder;
type Status = OrderStatus;

const STATUS_META: Record<Status, { label: string; dot: string; bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { label: "Pendiente", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  PROCESSING: { label: "Procesando", dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700", icon: Package },
  SHIPPED: { label: "Enviado", dot: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-700", icon: Truck },
  DELIVERED: { label: "Entregado", dot: "bg-green-400", bg: "bg-green-50", text: "text-green-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", dot: "bg-red-400", bg: "bg-red-50", text: "text-red-700", icon: XCircle },
};

const STATUS_FLOW: Status[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ── Order detail drawer ─────────────────────────────── */
function OrderDrawer({
  order, onClose, onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, s: Status) => void;
}) {
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm text-gray-900 font-mono">{order.orderNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Current status */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Estado actual</p>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress track */}
          {order.status !== "CANCELLED" && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Progreso del pedido</p>
              <div className="flex items-center">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  const m = STATUS_META[s];
                  const IconComp = m.icon as React.ComponentType<{ className: string; strokeWidth: number }>;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <button
                        type="button"
                        onClick={() => { onStatusChange(order.id, s); toast.success(`Estado → ${m.label}`); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${done ? "bg-gray-600 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-300"
                          } ${current ? "ring-4 ring-gray-600/10" : ""}`}
                        title={`Cambiar a ${m.label}`}
                      >
                        <IconComp className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-gray-600" : "bg-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                {STATUS_FLOW.map((s) => (
                  <span key={s} className="text-[10px] text-gray-400 text-center flex-1">{STATUS_META[s].label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Change status buttons */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_META) as Status[]).map((s) => {
                const m = STATUS_META[s];
                const active = order.status === s;
                const IconComp = m.icon as React.ComponentType<{ className: string; strokeWidth: number }>;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { onStatusChange(order.id, s); toast.success(`Estado → ${m.label}`); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs transition-all text-left ${active ? "border-gray-600 bg-gray-600 text-white" : `border-gray-100 ${m.bg} ${m.text} hover:border-gray-300`
                      }`}
                  >
                    <IconComp className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
              <p className="text-sm text-gray-900">{order.customer.name}</p>
              <p className="text-xs text-gray-400">{order.customer.email}</p>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Resumen</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Nº orden</span>
                <span className="text-gray-900 font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Ítems</span>
                <span className="text-gray-900">{order.items}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Fecha</span>
                <span className="text-gray-900">{order.date}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-900">${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function AdminOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState<Status | "all">("all");
  const [selectedOrder, setSelOrder] = useState<Order | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderRepository.findAll({ size: 500 });
      setList(res.content);
    } catch { toast.error("Error al cargar las órdenes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = useMemo(() => {
    let l = [...list];
    if (search) l = l.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customer.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") l = l.filter((o) => o.status === statusFilter);
    l.sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return l;
  }, [list, search, statusFilter, sortDir]);

  async function handleStatusChange(id: string, status: Status) {
    try {
      await orderRepository.updateStatus(id, status);
      setList((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      setSelOrder((prev) => prev?.id === id ? { ...prev, status } : prev);
    } catch { toast.error("Error al actualizar el estado"); }
  }

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const statuses: (Status | "all")[] = ["all", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  useEffect(() => setPage(1), [search, statusFilter, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div>
        <h1 className="text-xl text-gray-900 tracking-tight">Órdenes</h1>
        <p className="text-xs text-gray-400 mt-1">{list.length} órdenes en total</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingCart, label: "Total órdenes", value: list.length.toString() },
          { icon: DollarSign, label: "Ingresos", value: `$${list.reduce((s, o) => s + o.total, 0).toLocaleString()}` },
          { icon: Clock, label: "Pendientes", value: list.filter((o) => o.status === "PENDING").length.toString() },
          { icon: Truck, label: "En camino", value: list.filter((o) => o.status === "SHIPPED").length.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-sm text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => {
            const active = statusFilter === s;
            const count = s === "all" ? list.length : list.filter((o) => o.status === s).length;
            const m = s !== "all" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "bg-gray-600 text-white border-gray-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
              >
                {m && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : m.dot}`} />}
                {s === "all" ? "Todas" : m!.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nº orden o cliente..."
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300"
            />
          </div>
          <button
            onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            {sortDir === "desc" ? "Más reciente" : "Más antiguo"}
            <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-normal">Orden</th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-400 font-normal hidden sm:table-cell">Cliente</th>
                <th className="text-center px-4 py-3.5 text-xs text-gray-400 font-normal hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-400 font-normal">Estado</th>
                <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal hidden sm:table-cell">Ítems</th>
                <th className="text-right px-5 py-3.5 text-xs text-gray-400 font-normal">Total</th>
                <th className="text-right px-5 py-3.5 text-xs text-gray-400 font-normal">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-gray-900 font-mono">{order.orderNumber}</p>
                    <p className="text-[11px] text-gray-400 sm:hidden">{order.customer.name}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <p className="text-xs text-gray-700">{order.customer.name}</p>
                    <p className="text-[11px] text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400 hidden md:table-cell">{order.date}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-500 hidden sm:table-cell tabular-nums">{order.items}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-900 tabular-nums">${order.total.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelOrder(order)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">No hay órdenes que coincidan</p>
            </div>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
          extra={<span className="text-xs text-gray-900">Total: ${totalRevenue.toLocaleString()}</span>}
        />
      </div>

      {/* Drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}