import { useState } from "react";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, AlertCircle } from "lucide-react";

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

const MOCK_RESULTS: Record<string, TrackResult> = {
  "ORD-2024-001": {
    orderNumber: "ORD-2024-001", status: "delivered", carrier: "NX036 Express",
    trackingCode: "NEX-2026-A77821", estimatedDelivery: "Entregado el 13 mar 2026",
    product: "Apple iPhone 15 Pro Max · 2 artículos",
    events: [
      { date: "13/03/2026", time: "11:24", description: "Paquete entregado",          location: "350 Fifth Avenue, New York" },
      { date: "13/03/2026", time: "08:10", description: "En reparto con mensajero",   location: "Centro logístico Manhattan" },
      { date: "12/03/2026", time: "22:45", description: "Paquete en centro de reparto", location: "JFK Air Cargo, New York" },
      { date: "12/03/2026", time: "09:30", description: "Paquete recogido por transportista", location: "Almacén NX036 Madrid" },
      { date: "11/03/2026", time: "18:02", description: "Pedido preparado y embalado", location: "Almacén NX036 Madrid" },
      { date: "11/03/2026", time: "14:15", description: "Pago confirmado, en preparación", location: "—" },
    ],
  },
  "ORD-2024-002": {
    orderNumber: "ORD-2024-002", status: "in_transit", carrier: "UPS International",
    trackingCode: "1Z999AA10123456784", estimatedDelivery: "Est. 15 mar 2026",
    product: "Samsung Galaxy S24 Ultra · 1 artículo",
    events: [
      { date: "13/03/2026", time: "07:30", description: "En tránsito internacional", location: "Hub UPS, Frankfurt" },
      { date: "12/03/2026", time: "23:55", description: "Salida del país de origen",  location: "Aeropuerto Madrid-Barajas" },
      { date: "12/03/2026", time: "15:00", description: "Tramitación aduanera OK",    location: "Aduana Madrid" },
      { date: "11/03/2026", time: "12:00", description: "Paquete recogido por UPS",   location: "Almacén NX036 Madrid" },
    ],
  },
  "ORD-2024-004": {
    orderNumber: "ORD-2024-004", status: "preparing", carrier: "FedEx",
    trackingCode: "Pendiente de asignación", estimatedDelivery: "Est. 17–18 mar 2026",
    product: "Dell XPS 15 · 1 artículo",
    events: [
      { date: "10/03/2026", time: "16:30", description: "Pago confirmado, en preparación", location: "—" },
    ],
  },
};

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  preparing:  { label: "En preparación",  color: "text-amber-700",  bg: "bg-amber-50"  },
  shipped:    { label: "Despachado",      color: "text-blue-700",   bg: "bg-blue-50"   },
  in_transit: { label: "En tránsito",     color: "text-violet-700", bg: "bg-violet-50" },
  delivered:  { label: "Entregado",       color: "text-green-700",  bg: "bg-green-50"  },
  returned:   { label: "Devuelto",        color: "text-gray-600",   bg: "bg-gray-100"  },
};

const STEPS: { key: OrderStatus; label: string; icon: typeof Package }[] = [
  { key: "preparing",  label: "Preparación", icon: Clock       },
  { key: "shipped",    label: "Enviado",      icon: Package     },
  { key: "in_transit", label: "En tránsito",  icon: Truck       },
  { key: "delivered",  label: "Entregado",    icon: CheckCircle2},
];

const statusOrder: OrderStatus[] = ["preparing", "shipped", "in_transit", "delivered"];

export function OrderTracking() {
  const [query,  setQuery]  = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error,  setError]  = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const r = MOCK_RESULTS[query.trim().toUpperCase()];
    if (r) { setResult(r); setError(false); }
    else   { setResult(null); setError(true); }
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
          <button type="submit" className="h-10 px-5 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
            Rastrear
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">Prueba con: ORD-2024-001 · ORD-2024-002 · ORD-2024-004</p>
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
                  const done   = i <= stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={s.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        done ? "bg-gray-600 text-white" : "bg-white border border-gray-200 text-gray-300"
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