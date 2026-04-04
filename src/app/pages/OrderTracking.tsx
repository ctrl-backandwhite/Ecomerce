import { useState } from "react";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { orderRepository } from "../repositories/OrderRepository";
import { trackingRepository } from "../repositories/TrackingRepository";
import type { TrackingEvent } from "../repositories/TrackingRepository";
import type { Order } from "../repositories/OrderRepository";

type OrderStatus = "preparing" | "shipped" | "in_transit" | "delivered" | "returned";

interface TrackEvent {
  date: string;
  time: string;
  description: string;
  location: string;
}

interface TrackResult {
  orderNumber: string;
  status: OrderStatus;
  carrier: string;
  trackingCode: string;
  estimatedDelivery: string;
  product: string;
  events: TrackEvent[];
}

/* ── Map backend order status → local display status ── */
function mapOrderStatus(backendStatus: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    PENDING: "preparing",
    PROCESSING: "preparing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "returned",
  };
  return map[backendStatus] ?? "preparing";
}

/* ── Map TrackingEvent[] → TrackEvent[] ── */
function mapTrackingEvents(events: TrackingEvent[]): TrackEvent[] {
  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((ev) => {
      const d = new Date(ev.timestamp);
      return {
        date: d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        description: ev.description,
        location: ev.location ?? "—",
      };
    });
}

/* ── Build TrackResult from backend data ── */
function buildResult(order: Order, events: TrackingEvent[]): TrackResult {
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const productLabel = order.items.length > 0
    ? `${order.items[0].productName} · ${itemsCount} artículo${itemsCount !== 1 ? "s" : ""}`
    : `${itemsCount} artículo${itemsCount !== 1 ? "s" : ""}`;

  return {
    orderNumber: order.orderNumber,
    status: mapOrderStatus(order.status),
    carrier: "NX036 Express",
    trackingCode: "Pendiente de asignación",
    estimatedDelivery: order.status === "DELIVERED"
      ? `Entregado el ${new Date(order.updatedAt ?? order.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
      : "Consulta tu email para la fecha estimada",
    product: productLabel,
    events: mapTrackingEvents(events),
  };
}

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  preparing: { label: "En preparación", color: "text-amber-700", bg: "bg-amber-50" },
  shipped: { label: "Despachado", color: "text-blue-700", bg: "bg-blue-50" },
  in_transit: { label: "En tránsito", color: "text-violet-700", bg: "bg-violet-50" },
  delivered: { label: "Entregado", color: "text-green-700", bg: "bg-green-50" },
  returned: { label: "Devuelto", color: "text-gray-600", bg: "bg-gray-100" },
};

const STEPS: { key: OrderStatus; label: string; icon: typeof Package }[] = [
  { key: "preparing", label: "Preparación", icon: Clock },
  { key: "shipped", label: "Enviado", icon: Package },
  { key: "in_transit", label: "En tránsito", icon: Truck },
  { key: "delivered", label: "Entregado", icon: CheckCircle2 },
];

const statusOrder: OrderStatus[] = ["preparing", "shipped", "in_transit", "delivered"];

export function OrderTracking() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(false);
    setResult(null);

    try {
      // Try fetching the order by order number. The backend uses the order id
      // in the URL but many UIs search by orderNumber. We'll try getMyOrder first
      // (which works by id). If that fails, we do a search via getMyOrders and filter.
      let order: Order | null = null;

      // Attempt 1: direct lookup by id
      try { order = await orderRepository.getMyOrder(q); } catch { /* not found */ }

      // Attempt 2: search in user's orders by order number
      if (!order) {
        const page = await orderRepository.getMyOrders(0, 100);
        order = page.content.find(
          (o) => o.orderNumber.toUpperCase() === q.toUpperCase() || o.id === q,
        ) ?? null;
      }

      if (!order) { setError(true); setLoading(false); return; }

      // Fetch tracking events
      let events: TrackingEvent[] = [];
      try { events = await trackingRepository.getByOrderId(order.id); } catch { /* no events */ }

      setResult(buildResult(order, events));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = result ? statusOrder.indexOf(result.status) : -1;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Rastreo</p>
        <h1 className="text-4xl text-gray-900 tracking-tight mb-6">Seguimiento de pedido</h1>
        <form onSubmit={handleSearch} className="flex max-w-md mx-auto gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nº de orden — ej. ORD-2024-001"
              className="w-full h-10 pl-10 pr-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 placeholder-gray-300"
            />
          </div>
          <button type="submit" disabled={loading} className="h-10 px-5 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Rastrear
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">Introduce tu número de pedido para consultar el estado del envío</p>
      </section>

      <div className="py-12 px-4 max-w-3xl mx-auto">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-red-700">No se encontró ningún pedido con ese número. Verifica el número de orden en el email de confirmación.</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Número de pedido</p>
                  <p className="text-lg text-gray-900 font-mono">{result.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{result.product}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full ${STATUS_META[result.status].bg} ${STATUS_META[result.status].color}`}>
                  {STATUS_META[result.status].label}
                </span>
              </div>
              <div className="mt-5 grid sm:grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Transportista</p>
                  <p className="text-sm text-gray-700">{result.carrier}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Código de tracking</p>
                  <p className="text-sm text-gray-700 font-mono">{result.trackingCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Entrega estimada</p>
                  <p className="text-sm text-gray-700">{result.estimatedDelivery}</p>
                </div>
              </div>
            </div>

            {/* Progress steps */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Estado del envío</p>
              <div className="relative flex items-start justify-between">
                {/* Line */}
                <div className="absolute top-4 left-0 right-0 h-px bg-gray-100 z-0" />
                <div
                  className="absolute top-4 left-0 h-px bg-gray-600 z-0 transition-all duration-500"
                  style={{ width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * 100}%` : "0%" }}
                />

                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={s.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${done ? "bg-gray-600 text-white" : "bg-white border border-gray-200 text-gray-300"
                        } ${active ? "ring-4 ring-gray-600/10" : ""}`}>
                        <s.icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.5} />
                      </div>
                      <p className={`text-xs text-center ${done ? "text-gray-900" : "text-gray-400"}`}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events timeline */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-5">Historial de eventos</p>
              <div className="relative space-y-0">
                {result.events.map((ev, i) => (
                  <div key={i} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-gray-600" : "bg-gray-200"}`} />
                      {i !== result.events.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1.5" />}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className={`text-sm ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>{ev.description}</p>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{ev.date} · {ev.time}</span>
                      </div>
                      {ev.location !== "—" && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                          <p className="text-xs text-gray-400">{ev.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No search yet */}
        {!result && !error && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-100 mx-auto mb-4" strokeWidth={1} />
            <p className="text-sm text-gray-400">Introduce tu número de pedido para rastrear el envío</p>
          </div>
        )}
      </div>
    </div>
  );
}