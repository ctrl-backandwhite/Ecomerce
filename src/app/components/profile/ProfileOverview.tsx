import { useState, useEffect, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { orderRepository, type Order as ApiOrder } from "../../repositories/OrderRepository";
import { ShoppingBag, Heart, MapPin, Loader2 } from "lucide-react";
import { useCurrency } from "../../context/CurrencyContext";

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  processing: { label: "En proceso", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-600" },
  shipped: { label: "Enviado", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  delivered: { label: "Entregado", color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  cancelled: { label: "Cancelado", color: "text-red-500", bg: "bg-red-50", dot: "bg-red-500" },
};

interface SimpleOrder {
  id: string; date: string; status: OrderStatus;
  items: { id: string; name: string; image: string }[];
  total: number;
}

function mapApiOrder(api: ApiOrder): SimpleOrder {
  const sMap: Record<string, OrderStatus> = { PENDING: "processing", CONFIRMED: "processing", PROCESSING: "processing", SHIPPED: "shipped", IN_TRANSIT: "shipped", DELIVERED: "delivered", CANCELLED: "cancelled", REFUNDED: "cancelled" };
  return {
    id: api.orderNumber || api.id,
    date: api.createdAt,
    status: sMap[api.status] ?? "processing",
    items: api.items.map((i) => ({ id: i.id, name: i.productName, image: i.productImage ?? "" })),
    total: api.total,
  };
}

type Tab = "overview" | "orders" | "favorites" | "addresses" | "security";

interface Props {
  onTabChange: (tab: Tab) => void;
}

export function ProfileOverview({ onTabChange }: Props) {
  const { user } = useUser();
  const { formatPrice } = useCurrency();
  const [lastOrder, setLastOrder] = useState<SimpleOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    orderRepository.getMyOrders(0, 1)
      .then((page) => {
        if (page.content.length > 0) setLastOrder(mapApiOrder(page.content[0]));
      })
      .catch(() => { })
      .finally(() => setLoadingOrder(false));
  }, []);

  const cfg = lastOrder ? statusConfig[lastOrder.status] : null;

  const memberDate = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString("es-CL", { year: "numeric", month: "long" })
    : "";

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stat: Favoritos */}
        <button
          onClick={() => onTabChange("favorites")}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left hover:border-gray-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-4">
            <Heart className="w-4.5 h-4.5 text-red-400" strokeWidth={1.5} />
          </div>
          <p className="text-2xl text-gray-900 mb-0.5">{user.favoriteIds.length}</p>
          <p className="text-xs text-gray-400">Favoritos</p>
          <p className="text-xs text-gray-400 mt-3 group-hover:text-gray-600 transition-colors">Ver lista →</p>
        </button>

        {/* Stat: Direcciones */}
        <button
          onClick={() => onTabChange("addresses")}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left hover:border-gray-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
            <MapPin className="w-4.5 h-4.5 text-blue-400" strokeWidth={1.5} />
          </div>
          <p className="text-2xl text-gray-900 mb-0.5">{user.addresses.length}</p>
          <p className="text-xs text-gray-400">Direcciones</p>
          <p className="text-xs text-gray-400 mt-3 group-hover:text-gray-600 transition-colors">Gestionar →</p>
        </button>

        {/* Stat: Pedidos totales */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag className="w-4.5 h-4.5 text-gray-500" strokeWidth={1.5} />
          </div>
          <p className="text-2xl text-gray-900 mb-0.5">{user.totalOrders}</p>
          <p className="text-xs text-gray-400">Pedidos totales</p>
          <p className="text-xs text-gray-400 mt-3">Desde {memberDate}</p>
        </div>
      </div>

      {/* Último pedido */}
      <button
        onClick={() => onTabChange("orders")}
        className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left hover:border-gray-300 transition-all"
      >
        {loadingOrder ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : lastOrder && cfg ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Último pedido</p>
                <p className="text-sm text-gray-900">{lastOrder.id}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {lastOrder.items.slice(0, 3).map((item) => (
                <img
                  key={item.id}
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                />
              ))}
              {lastOrder.items.length > 3 && (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{lastOrder.items.length - 3}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {new Date(lastOrder.date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}{formatPrice(lastOrder.total)}
            </p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">
              Ver todos los pedidos →
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">Aún no tienes pedidos</p>
            <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">
              Ver catálogo →
            </p>
          </div>
        )}
      </button>
    </div>
  );
}