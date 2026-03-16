import { useState } from "react";
import { useNavigate } from "react-router";
import { mockOrders, statusConfig, OrderStatus, Order, OrderItem } from "../../data/mockOrders";
import { products } from "../../data/products";
import { useCart } from "../../context/CartContext";
import {
  Package,
  X,
  Truck,
  RotateCcw,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronRight,
  ClipboardList,
  ShoppingBag,
  Ban,
  Copy,
  Send,
  ShoppingCart,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

/* ── Tracking steps ──────────────────────────────────────── */
interface TrackStep {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const allSteps: TrackStep[] = [
  {
    key: "confirmed",
    label: "Pedido confirmado",
    sublabel: "Tu pedido fue recibido",
    icon: <ClipboardList className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "preparing",
    label: "En preparación",
    sublabel: "Estamos armando tu pedido",
    icon: <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "picked",
    label: "Recogido por courier",
    sublabel: "El repartidor tiene tu paquete",
    icon: <Package className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "transit",
    label: "En tránsito",
    sublabel: "Tu pedido va en camino",
    icon: <Truck className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "delivered",
    label: "Entregado",
    sublabel: "¡Tu pedido llegó!",
    icon: <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />,
  },
];

const statusStepMap: Record<OrderStatus, number> = {
  processing: 1,
  shipped:    3,
  delivered:  4,
  cancelled: -1,
};

/* ── Star Rating input ───────────────────────────────────── */
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-gray-400 ml-1">
          {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][value]}
        </span>
      )}
    </div>
  );
}

/* ── Rating Modal ────────────────────────────────────────── */
function RatingModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.id, 0]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(order.items.map((i) => [i.id, ""]))
  );
  const [submitted, setSubmitted] = useState(false);

  const allRated = order.items.every((i) => ratings[i.id] > 0);

  const handleSubmit = () => {
    if (!allRated) {
      toast.error("Por favor califica todos los productos antes de enviar");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Valorar productos</p>
              <p className="text-xs text-gray-400">{order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base text-gray-900 mb-2">¡Gracias por tu valoración!</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Tu opinión nos ayuda a mejorar y a otros compradores a tomar mejores decisiones.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <img src={item.image} alt={item.name} className="w-7 h-7 rounded-lg object-cover" />
                    <span className="text-xs text-gray-600 max-w-[100px] truncate">{item.name}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= ratings[item.id] ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-6 text-sm text-gray-700 bg-gray-200 rounded-xl px-6 py-2.5 hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            /* ── Rating form ── */
            <div className="space-y-5">
              <p className="text-xs text-gray-400">
                Califica cada producto de tu pedido del 1 al 5 y deja un comentario opcional.
              </p>

              {order.items.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Product info */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.category} · x{item.quantity}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Tu calificación</p>
                      <StarInput
                        value={ratings[item.id]}
                        onChange={(v) => setRatings((r) => ({ ...r, [item.id]: v }))}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageSquare className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                        <p className="text-xs text-gray-400">Comentario (opcional)</p>
                      </div>
                      <textarea
                        rows={2}
                        value={comments[item.id]}
                        onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))}
                        placeholder="¿Qué te pareció el producto?"
                        className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allRated}
              className={`ml-auto inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${
                allRated
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              Enviar valoración
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Order Modal ─────────────────────────────────────────── */
function OrderModal({
  order,
  onClose,
  onRate,
}: {
  order: Order;
  onClose: () => void;
  onRate: () => void;
}) {
  const { addToCart, updateQuantity, items: cartItems } = useCart();
  const navigate = useNavigate();

  const cfg = statusConfig[order.status];
  const isCancelled = order.status === "cancelled";
  const completedStep = statusStepMap[order.status];
  const truckPercent = isCancelled ? 0 : (completedStep / (allSteps.length - 1)) * 100;

  const orderDate = new Date(order.date).toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const handleCopyTracking = () => {
    if (order.trackingCode) {
      navigator.clipboard.writeText(order.trackingCode);
      toast.success("Código copiado al portapapeles");
    }
  };

  const handleReorder = () => {
    let added = 0;
    order.items.forEach((orderItem) => {
      const product = products.find((p) => p.id === orderItem.id);
      if (product) {
        // Check if already in cart (match by productId for variant-aware items, or id for legacy)
        const inCart = cartItems.find((c) => (c.productId ?? c.id) === product.id && !c.variantId);
        if (inCart) {
          updateQuantity(inCart.id, inCart.quantity + orderItem.quantity);
        } else {
          // Add with the correct quantity in one call
          addToCart(product, { quantity: orderItem.quantity });
        }
        added++;
      }
    });
    if (added > 0) {
      toast.success(`${added} producto${added > 1 ? "s" : ""} añadido${added > 1 ? "s" : ""} al carrito`);
      onClose();
      navigate("/carrito");
    } else {
      toast.error("No se pudieron encontrar los productos en el catálogo");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">{order.id}</p>
              <p className="text-xs text-gray-400">{orderDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

          {/* Tracking */}
          {isCancelled ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-red-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-red-700">Pedido cancelado</p>
                <p className="text-xs text-red-400 mt-0.5">Este pedido fue cancelado. Si tienes dudas, contáctanos.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs text-gray-400 mb-5 uppercase tracking-wider">Seguimiento del pedido</p>

              {order.trackingCode && (
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-xs text-gray-400">Código de seguimiento:</span>
                  <span className="text-xs font-mono text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded">
                    {order.trackingCode}
                  </span>
                  <button
                    onClick={handleCopyTracking}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-white transition-colors"
                    title="Copiar código"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Progress bar + truck */}
              <div className="relative mb-8 px-2">
                <div className="h-1 bg-gray-200 rounded-full relative">
                  <div
                    className="h-full bg-gray-600 rounded-full transition-all duration-700"
                    style={{ width: `${truckPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700"
                    style={{ left: `${truckPercent}%` }}
                  >
                    <div className="relative">
                      {order.status !== "delivered" && (
                        <span className="absolute inset-0 rounded-full bg-gray-600/20 animate-ping scale-150" />
                      )}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border-2 border-white ${order.status === "delivered" ? "bg-green-500" : "bg-gray-600"}`}>
                        <Truck className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  {allSteps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full -mt-[18px] transition-colors ${i <= completedStep ? "bg-gray-600" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-0">
                {allSteps.map((step, i) => {
                  const done   = i <= completedStep;
                  const active = i === completedStep;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          done && !active ? "bg-gray-600 text-white"
                          : active ? "bg-gray-600 text-white ring-4 ring-gray-600/10"
                          : "bg-gray-100 text-gray-300"
                        }`}>
                          {done && !active
                            ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                            : active ? step.icon
                            : <CircleDot className="w-4 h-4" strokeWidth={1.5} />}
                        </div>
                        {i < allSteps.length - 1 && (
                          <div className={`w-px flex-1 my-1 min-h-[20px] transition-colors ${i < completedStep ? "bg-gray-600" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <div className="pb-4 pt-1.5 min-w-0">
                        <p className={`text-sm ${done ? "text-gray-900" : "text-gray-300"}`}>
                          {step.label}
                          {active && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                              <Clock className="w-2.5 h-2.5" />
                              En curso
                            </span>
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? "text-gray-400" : "text-gray-200"}`}>{step.sublabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Productos</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category} · x{item.quantity}</p>
                  </div>
                  <p className="text-sm text-gray-900 flex-shrink-0">${item.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Resumen</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>${order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Envío</span>
                <span className={order.shipping === 0 ? "text-green-600" : ""}>
                  {order.shipping === 0 ? "Gratis" : `$${order.shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-xs text-gray-500">{order.address}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-gray-50 flex-wrap">
          {order.status === "delivered" && (
            <>
              {/* Rate */}
              <button
                onClick={onRate}
                className="inline-flex items-center gap-1.5 text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-xl px-4 py-2.5 hover:bg-amber-100 transition-colors"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Valorar productos
              </button>

              {/* Reorder */}
              <button
                onClick={handleReorder}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-200 text-gray-700 rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} />
                Volver a pedir
              </button>
            </>
          )}

          {order.status === "shipped" && (
            <button
              onClick={() => toast.success("Redirigiendo al sitio de rastreo...")}
              className="inline-flex items-center gap-1.5 text-xs bg-gray-200 text-gray-700 rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
              Rastrear en tiempo real
            </button>
          )}

          <button onClick={onClose} className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Filter tabs ─────────────────────────────────────────── */
const filterTabs: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all",        label: "Todos" },
  { id: "processing", label: "En proceso" },
  { id: "shipped",    label: "Enviados" },
  { id: "delivered",  label: "Entregados" },
  { id: "cancelled",  label: "Cancelados" },
];

/* ── Main component ──────────────────────────────────────── */
export function ProfilePedidos() {
  const [filter, setFilter]     = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [rating, setRating]     = useState<Order | null>(null);

  const filtered = filter === "all" ? mockOrders : mockOrders.filter((o) => o.status === filter);

  return (
    <>
      {/* Rating modal (z-60, on top of order modal) */}
      {rating && (
        <RatingModal order={rating} onClose={() => setRating(null)} />
      )}

      {/* Order modal */}
      {selected && !rating && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onRate={() => setRating(selected)}
        />
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">Mis Pedidos</h2>
          <p className="text-xs text-gray-400 mt-0.5">{mockOrders.length} pedidos en total</p>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-none">
          {filterTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === id
                  ? "bg-gray-600 text-white border-gray-600"
                  : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-500">No hay pedidos en esta categoría</p>
            </div>
          ) : (
            filtered.map((order) => {
              const cfg = statusConfig[order.status];
              const orderDate = new Date(order.date).toLocaleDateString("es-CL", {
                day: "numeric", month: "short", year: "numeric",
              });
              const completedStep = statusStepMap[order.status];
              const progressPct = order.status === "cancelled" ? 0 : (completedStep / (allSteps.length - 1)) * 100;

              return (
                <button
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  {/* Thumbnails */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {order.items.slice(0, 2).map((item) => (
                      <img
                        key={item.id}
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm"
                      />
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm text-gray-900">{order.id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {orderDate} · {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                    </p>
                    {order.status !== "cancelled" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${order.status === "delivered" ? "bg-green-500" : "bg-gray-600"}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <Truck className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                        <span className="text-[10px] text-gray-400">{allSteps[completedStep]?.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">${order.total.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{order.items.length} ítem{order.items.length !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}