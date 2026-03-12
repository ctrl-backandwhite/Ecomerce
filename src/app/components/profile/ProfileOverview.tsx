import { useUser } from "../../context/UserContext";
import { mockOrders, statusConfig } from "../../data/mockOrders";
import { ShoppingBag, Heart, MapPin } from "lucide-react";

type Tab = "resumen" | "pedidos" | "favoritos" | "direcciones" | "seguridad";

interface Props {
  onTabChange: (tab: Tab) => void;
}

export function ProfileOverview({ onTabChange }: Props) {
  const { user } = useUser();
  const lastOrder = mockOrders[0];
  const cfg = statusConfig[lastOrder.status];

  const memberDate = new Date(user.memberSince).toLocaleDateString("es-CL", {
    year: "numeric", month: "long",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Último pedido */}
      <button
        onClick={() => onTabChange("pedidos")}
        className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left hover:border-gray-300 transition-all"
      >
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
          {" · "}${lastOrder.total.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">
          Ver todos los pedidos →
        </p>
      </button>

      {/* Stat: Favoritos */}
      <button
        onClick={() => onTabChange("favoritos")}
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
        onClick={() => onTabChange("direcciones")}
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
  );
}