import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { orderRepository, type Order as ApiOrder } from "../../repositories/OrderRepository";
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
import { useLanguage } from "../../context/LanguageContext";

/* ── Local types (mapped from API) ────────────────────────── */

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "in_transit" | "delivered" | "cancelled" | "refunded";

interface OrderItem {
  id: string;
  productId: string;
  sku?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  trackingCode?: string;
}

const statusConfig: Record<OrderStatus, { labelKey: string; color: string; bg: string; dot: string }> = {
  pending: { labelKey: "profile.pedidos.status.pending", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  confirmed: { labelKey: "profile.pedidos.status.confirmed", color: "text-cyan-600", bg: "bg-cyan-50", dot: "bg-cyan-500" },
  processing: { labelKey: "profile.pedidos.status.processing", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-600" },
  shipped: { labelKey: "profile.pedidos.status.shipped", color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
  in_transit: { labelKey: "profile.pedidos.status.in_transit", color: "text-indigo-600", bg: "bg-indigo-50", dot: "bg-indigo-500" },
  delivered: { labelKey: "profile.pedidos.status.delivered", color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  cancelled: { labelKey: "profile.pedidos.status.cancelled", color: "text-red-500", bg: "bg-red-50", dot: "bg-red-500" },
  refunded: { labelKey: "profile.pedidos.status.refunded", color: "text-orange-500", bg: "bg-orange-50", dot: "bg-orange-500" },
};

const fmtPrice = (n: number) =>
  "$" + n.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23d1d5db'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E";

function mapApiOrder(api: ApiOrder): Order {
  const statusMap: Record<string, OrderStatus> = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  };

  // Format shippingAddress object into a readable string
  const addr = api.shippingAddress;
  let addressStr = "";
  if (addr && typeof addr === "object") {
    const parts = [
      addr.street,
      addr.city,
      addr.region,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    addressStr = parts.join(", ") as string;
    if (addr.fullName) addressStr = `${addr.fullName} — ${addressStr}`;
  }

  return {
    id: api.orderNumber || api.id,
    date: api.createdAt,
    status: statusMap[api.status] ?? "pending",
    items: api.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      name: item.productName,
      image: item.productImage ?? "",
      price: item.unitPrice,
      quantity: item.quantity,
      category: "",
    })),
    subtotal: api.subtotal,
    shipping: api.shippingCost,
    total: api.total,
    address: addressStr,
    trackingCode: undefined,
  };
}

/* ── Tracking steps ──────────────────────────────────────── */
interface TrackStep {
  key: string;
  labelKey: string;
  sublabelKey: string;
  icon: React.ReactNode;
}

const allSteps: TrackStep[] = [
  {
    key: "confirmed",
    labelKey: "profile.pedidos.step.confirmed",
    sublabelKey: "profile.pedidos.step.confirmed.sub",
    icon: <ClipboardList className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "preparing",
    labelKey: "profile.pedidos.step.preparing",
    sublabelKey: "profile.pedidos.step.preparing.sub",
    icon: <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "picked",
    labelKey: "profile.pedidos.step.picked",
    sublabelKey: "profile.pedidos.step.picked.sub",
    icon: <Package className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "transit",
    labelKey: "profile.pedidos.step.transit",
    sublabelKey: "profile.pedidos.step.transit.sub",
    icon: <Truck className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    key: "delivered",
    labelKey: "profile.pedidos.step.delivered",
    sublabelKey: "profile.pedidos.step.delivered.sub",
    icon: <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />,
  },
];

const statusStepMap: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  in_transit: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
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
            className={`w-5 h-5 transition-colors ${s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
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
  const { t } = useLanguage();
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
      toast.error(t("profile.pedidos.rating.error"));
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
              <p className="text-sm text-gray-900">{t("profile.pedidos.rating.title")}</p>
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
              <h3 className="text-base text-gray-900 mb-2">{t("profile.pedidos.rating.success")}</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                {t("profile.pedidos.rating.success.desc")}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <img src={item.image || IMG_FALLBACK} alt={item.name} className="w-7 h-7 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }} />
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
                {t("profile.pedidos.action.close")}
              </button>
            </div>
          ) : (
            /* ── Rating form ── */
            <div className="space-y-5">
              <p className="text-xs text-gray-400">
                {t("profile.pedidos.rating.instruction")}
              </p>

              {order.items.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Product info */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                    <img
                      src={item.image || IMG_FALLBACK}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                      onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.category ? `${item.category} · ` : ""}x{item.quantity}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">{t("profile.pedidos.rating.ratinglabel")}</p>
                      <StarInput
                        value={ratings[item.id]}
                        onChange={(v) => setRatings((r) => ({ ...r, [item.id]: v }))}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageSquare className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                        <p className="text-xs text-gray-400">{t("profile.pedidos.rating.comment")}</p>
                      </div>
                      <textarea
                        rows={2}
                        value={comments[item.id]}
                        onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))}
                        placeholder={t("profile.pedidos.rating.placeholder")}
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
              {t("profile.pedidos.rating.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allRated}
              className={`ml-auto inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${allRated
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("profile.pedidos.rating.submit")}
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
  const { t, locale } = useLanguage();
  const { addToCart, updateQuantity, items: cartItems } = useCart();
  const navigate = useNavigate();

  const cfg = statusConfig[order.status];
  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  const completedStep = statusStepMap[order.status];
  const truckPercent = isCancelled ? 0 : (completedStep / (allSteps.length - 1)) * 100;

  const dateLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CL";
  const orderDate = new Date(order.date).toLocaleDateString(dateLocale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const handleCopyTracking = () => {
    if (order.trackingCode) {
      navigator.clipboard.writeText(order.trackingCode);
      toast.success(t("profile.pedidos.tracking.copied"));
    }
  };

  const buildProductFromItem = (item: OrderItem) => ({
    id: item.productId,
    name: item.name,
    sku: item.sku ?? "",
    price: item.price,
    image: item.image,
    images: [],
    attributes: [],
    variants: [],
    keywords: [],
    rating: 0,
    reviews: 0,
    stock: 0,
    stockStatus: "in_stock",
    manageStock: false,
    allowBackorder: false,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    shippingClass: "",
    slug: "",
    brand: "",
    description: "",
    shortDescription: "",
    taxClass: "",
    category: "",
    subcategory: "",
    barcode: "",
    metaTitle: "",
    metaDescription: "",
    status: "active",
    visibility: "public",
    featured: false,
  }) as unknown as Parameters<typeof addToCart>[0];

  const handleAddItemToCart = (item: OrderItem) => {
    if (!item.productId) {
      toast.error(t("profile.pedidos.toast.product_unidentified"));
      return;
    }
    addToCart(buildProductFromItem(item), { quantity: item.quantity });
    toast.success(t("profile.pedidos.toast.product_added").replace("{name}", item.name));
  };

  const handleReorder = () => {
    if (!order.items.length) {
      toast.error(t("profile.pedidos.toast.no_items"));
      return;
    }
    let added = 0;
    order.items.forEach((item) => {
      if (!item.productId) return;
      addToCart(buildProductFromItem(item), { quantity: item.quantity });
      added += 1;
    });
    if (added === 0) {
      toast.error(t("profile.pedidos.toast.no_identified"));
      return;
    }
    toast.success(
      added === 1
        ? t("profile.pedidos.toast.added_to_cart.one")
        : t("profile.pedidos.toast.added_to_cart.other").replace("{n}", String(added))
    );
    onClose();
    navigate("/cart");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

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
              {t(cfg.labelKey)}
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
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {isCancelled ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-red-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-red-700">{t("profile.pedidos.cancelled.title")}</p>
                <p className="text-xs text-red-400 mt-0.5">{t("profile.pedidos.cancelled.desc")}</p>
              </div>
            </div>
          ) : (
            /* ── Two-column layout: tracking left, products right ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Tracking */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">{t("profile.pedidos.tracking.title")}</p>

                {order.trackingCode && (
                  <div className="flex items-center gap-2 mb-5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-xs text-gray-400">{t("profile.pedidos.tracking.code")}</span>
                    <span className="text-xs font-mono text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded">
                      {order.trackingCode}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-white transition-colors"
                      title={t("profile.pedidos.tracking.copy")}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Progress bar + truck */}
                <div className="relative mb-5 px-2">
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white ${order.status === "delivered" ? "bg-green-500" : "bg-gray-600"}`}>
                          <Truck className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    {allSteps.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full -mt-[16px] transition-colors ${i <= completedStep ? "bg-gray-600" : "bg-gray-200"}`} />
                    ))}
                  </div>
                </div>

                {/* Step list */}
                <div className="space-y-0">
                  {allSteps.map((step, i) => {
                    const done = i <= completedStep;
                    const active = i === completedStep;
                    return (
                      <div key={step.key} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${done && !active ? "bg-gray-600 text-white"
                            : active ? "bg-gray-600 text-white ring-4 ring-gray-600/10"
                              : "bg-gray-100 text-gray-300"
                            }`}>
                            {done && !active
                              ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                              : active ? step.icon
                                : <CircleDot className="w-3.5 h-3.5" strokeWidth={1.5} />}
                          </div>
                          {i < allSteps.length - 1 && (
                            <div className={`w-px flex-1 my-0.5 min-h-[12px] transition-colors ${i < completedStep ? "bg-gray-600" : "bg-gray-200"}`} />
                          )}
                        </div>
                        <div className="pb-1.5 pt-0.5 min-w-0">
                          <p className={`text-xs ${done ? "text-gray-900" : "text-gray-300"}`}>
                            {t(step.labelKey)}
                            {active && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                                <Clock className="w-2.5 h-2.5" />
                                {t("profile.pedidos.step.current")}
                              </span>
                            )}
                          </p>
                          <p className={`text-[11px] mt-0.5 ${done ? "text-gray-400" : "text-gray-200"}`}>{t(step.sublabelKey)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Products (right column) */}
              <div>
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">{t("profile.pedidos.products.title")}</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                      <img src={item.image || IMG_FALLBACK} alt={item.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-100" onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.category ? `${item.category} · ` : ""}x{item.quantity}</p>
                      </div>
                      <p className="text-sm text-gray-900 flex-shrink-0">{fmtPrice(item.price)}</p>
                      {order.status !== "cancelled" && order.status !== "refunded" && (
                        <button
                          type="button"
                          onClick={() => handleAddItemToCart(item)}
                          title={t("profile.pedidos.products.item.add_to_cart")}
                          aria-label={t("profile.pedidos.products.item.add_to_cart.aria").replace("{name}", item.name)}
                          className="flex-shrink-0 w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-white hover:bg-gray-900 hover:border-gray-900 transition-colors flex items-center justify-center"
                        >
                          <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Totals + Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Totals */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t("profile.pedidos.summary.title")}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t("profile.pedidos.summary.subtotal")}</span><span>{fmtPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t("profile.pedidos.summary.shipping")}</span>
                  <span className={order.shipping === 0 ? "text-green-600" : ""}>
                    {order.shipping === 0 ? t("profile.pedidos.summary.shipping.free") : fmtPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-900 pt-2 border-t border-gray-100">
                  <span>{t("profile.pedidos.summary.total")}</span><span>{fmtPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{t("profile.pedidos.address.title")}</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-gray-500">{order.address || t("profile.pedidos.address.empty")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-gray-50 flex-wrap">
          {order.status === "delivered" && (
            <button
              onClick={onRate}
              className="inline-flex items-center gap-1.5 text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-xl px-4 py-2.5 hover:bg-amber-100 transition-colors"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {t("profile.pedidos.action.rate")}
            </button>
          )}

          {order.status !== "cancelled" && order.status !== "refunded" && (
            <button
              onClick={handleReorder}
              className="inline-flex items-center gap-1.5 text-xs bg-gray-900 text-white rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("profile.pedidos.action.reorder")}
            </button>
          )}

          {(order.status === "shipped" || order.status === "in_transit") && (
            <button
              onClick={() => toast.success(t("profile.pedidos.toast.tracking_redirect"))}
              className="inline-flex items-center gap-1.5 text-xs bg-gray-200 text-gray-700 rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("profile.pedidos.action.track")}
            </button>
          )}

          <button onClick={onClose} className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {t("profile.pedidos.action.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Filter tabs ─────────────────────────────────────────── */
const filterTabs: { id: "all" | OrderStatus; labelKey: string }[] = [
  { id: "all", labelKey: "profile.pedidos.filter.all" },
  { id: "pending", labelKey: "profile.pedidos.filter.pending" },
  { id: "confirmed", labelKey: "profile.pedidos.filter.confirmed" },
  { id: "processing", labelKey: "profile.pedidos.filter.processing" },
  { id: "shipped", labelKey: "profile.pedidos.filter.shipped" },
  { id: "in_transit", labelKey: "profile.pedidos.filter.in_transit" },
  { id: "delivered", labelKey: "profile.pedidos.filter.delivered" },
  { id: "cancelled", labelKey: "profile.pedidos.filter.cancelled" },
];

/* ── Main component ──────────────────────────────────────── */
export function ProfilePedidos() {
  const { t, locale } = useLanguage(); const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [rating, setRating] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const page = await orderRepository.getMyOrders(0, 50);
      setOrders(page.content.map(mapApiOrder));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      {/* Rating modal (z-60, on top of order modal) — portal to escape parent overflow/transform */}
      {rating && createPortal(
        <RatingModal order={rating} onClose={() => setRating(null)} />,
        document.body,
      )}

      {/* Order modal — portal to escape parent overflow/transform */}
      {selected && !rating && createPortal(
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onRate={() => setRating(selected)}
        />,
        document.body,
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">{t("profile.pedidos.title")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {orders.length === 1
              ? t("profile.pedidos.subtitle.one")
              : `${orders.length} ${t("profile.pedidos.subtitle.other")}`}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
          {filterTabs.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === id
                ? "bg-gray-600 text-white border-gray-600"
                : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
              {t(labelKey)}
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
              <p className="text-sm text-gray-500">{t("profile.pedidos.empty")}</p>
            </div>
          ) : (
            filtered.map((order) => {
              const cfg = statusConfig[order.status];
              const dateLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CL";
              const orderDate = new Date(order.date).toLocaleDateString(dateLocale, {
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
                        src={item.image || IMG_FALLBACK}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm"
                        onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                      />
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm text-gray-900">{order.id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {t(cfg.labelKey)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {orderDate} · {order.items.length} {order.items.length === 1 ? t("profile.pedidos.products.item.products.one") : t("profile.pedidos.products.item.products.other")}
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
                        <span className="text-[10px] text-gray-400">{allSteps[completedStep] ? t(allSteps[completedStep].labelKey) : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{fmtPrice(order.total)}</p>
                      <p className="text-[10px] text-gray-400">{order.items.length} {order.items.length === 1 ? t("profile.pedidos.products.item.units.one") : t("profile.pedidos.products.item.units.other")}</p>
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