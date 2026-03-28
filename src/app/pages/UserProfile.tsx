import { useState } from "react";
import { useUser } from "../context/UserContext";
import { ProfileOverview } from "../components/profile/ProfileOverview";
import { ProfileDatos } from "../components/profile/ProfileDatos";
import { ProfilePedidos } from "../components/profile/ProfilePedidos";
import { ProfileFavoritos } from "../components/profile/ProfileFavoritos";
import { ProfileDirecciones } from "../components/profile/ProfileDirecciones";
import { ProfileSeguridad } from "../components/profile/ProfileSeguridad";
import { ProfileTienda } from "../components/profile/ProfileTienda";
import { ProfilePagos } from "../components/profile/ProfilePagos";
import { ProfileGiftCards } from "../components/profile/ProfileGiftCards";
import {
  User, ShoppingBag, Heart, MapPin, Shield, LogOut,
  ChevronRight, LayoutDashboard, Store, CreditCard, Gift,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";

type Tab = "resumen" | "datos" | "pedidos" | "favoritos" | "direcciones" | "pagos" | "giftcards" | "tienda" | "seguridad";

const tabs: { id: Tab; label: string; icon: typeof User; sellerOnly?: boolean }[] = [
  { id: "resumen",     label: "Resumen",           icon: LayoutDashboard },
  { id: "datos",       label: "Mis Datos",         icon: User },
  { id: "pedidos",     label: "Mis Pedidos",       icon: ShoppingBag },
  { id: "favoritos",   label: "Favoritos",         icon: Heart },
  { id: "direcciones", label: "Direcciones",       icon: MapPin },
  { id: "pagos",       label: "Métodos de Pago",   icon: CreditCard },
  { id: "giftcards",   label: "Tarjetas Regalo",   icon: Gift },
  { id: "tienda",      label: "Mi Tienda",         icon: Store, sellerOnly: true },
  { id: "seguridad",   label: "Seguridad",         icon: Shield },
];

export function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "resumen";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { user } = useUser();
  const navigate = useNavigate();

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  const contentMap: Record<Tab, JSX.Element> = {
    resumen:     <ProfileOverview onTabChange={setActiveTab as any} />,
    datos:       <ProfileDatos />,
    pedidos:     <ProfilePedidos />,
    favoritos:   <ProfileFavoritos />,
    direcciones: <ProfileDirecciones />,
    pagos:       <ProfilePagos />,
    giftcards:   <ProfileGiftCards />,
    tienda:      <ProfileTienda />,
    seguridad:   <ProfileSeguridad />,
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <span>Inicio</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900">Mi Cuenta</span>
          </div>
          <h1 className="text-2xl tracking-tight text-gray-900">Mi Cuenta</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">

            {/* Profile card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-500 flex items-center justify-center mb-4 text-white text-xl tracking-widest">
                  {initials}
                </div>
                <p className="text-base text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Miembro NX036
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                {[
                  { value: user.totalOrders,          label: "Pedidos" },
                  { value: user.loyaltyPoints,         label: "Puntos"  },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-sm text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden lg:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <nav>
                {tabs.filter((t) => !t.sellerOnly || user.isSeller).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setSearchParams({ tab: id }); }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left transition-colors border-l-2 ${
                      activeTab === id
                        ? "border-gray-900 bg-gray-50 text-gray-900"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {label}
                    {/* Badge: payment methods count */}
                    {id === "pagos" && user.paymentMethods.length > 0 && (
                      <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                        {user.paymentMethods.length}
                      </span>
                    )}
                    {activeTab === id && id !== "pagos" && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                    )}
                    {activeTab === id && id === "pagos" && (
                      <ChevronRight className="w-3.5 h-3.5 ml-1 text-gray-400" />
                    )}
                  </button>
                ))}

                <div className="border-t border-gray-100">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border-l-2 border-transparent"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    Cerrar Sesión
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ── MAIN CONTENT ─────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Mobile tab selector */}
            <div className="lg:hidden mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as Tab)}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-gray-400"
              >
                {tabs.filter((t) => !t.sellerOnly || user.isSeller).map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            {/* Active section */}
            {contentMap[activeTab]}
          </main>
        </div>
      </div>
    </div>
  );
}