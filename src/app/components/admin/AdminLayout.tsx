import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTour } from "./AdminTour";
import { TimezoneSidebar } from "../TimezoneSidebar";
import { useTimezone } from "../../context/TimezoneContext";
import { Menu, Clock } from "lucide-react";
import {
  NotificationsPanel,
  DEFAULT_NOTIFICATIONS,
  type AppNotification,
} from "./NotificationsPanel";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/productos": "Productos",
  "/admin/categorias": "Categorías",
  "/admin/marcas": "Marcas",
  "/admin/atributos": "Atributos",
  "/admin/medios": "Galería de Medios",
  "/admin/slides": "Slides Home",
  "/admin/ordenes": "Órdenes",
  "/admin/facturas": "Facturas",
  "/admin/devoluciones": "Devoluciones",
  "/admin/clientes": "Clientes",
  "/admin/resenas": "Reseñas",
  "/admin/cupones": "Cupones",
  "/admin/puntos": "Programa de Fidelidad",
  "/admin/regalo": "Tarjetas Regalo",
  "/admin/campanas": "Campañas",
  "/admin/newsletter": "Newsletter",
  "/admin/seo": "SEO & Meta datos",
  "/admin/garantias": "Garantías",
  "/admin/flujos": "Flujos de trabajo",
  "/admin/envios": "Envíos",
  "/admin/impuestos": "Impuestos",
  "/admin/emails": "Plantillas de Email",
  "/admin/configuracion": "Configuración",
  "/admin/reportes": "Reportes",
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS);
  const { selectedCountry, toggleSidebar } = useTimezone();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] ?? "Admin";

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearRead = () => setNotifications(prev => prev.filter(n => !n.read));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDelete={deleteNotif}
        onClearRead={clearRead}
      />

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          id="tour-topbar"
          className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-4 flex-shrink-0"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="lg:hidden w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <h1 className="text-[13px] text-gray-900 tracking-wide font-light">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <AdminTour />

            {/* Timezone */}
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Horario por país"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm leading-none">{selectedCountry.flag}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <span className="w-px h-5 bg-gray-200" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <p className="text-[11px] text-gray-900 font-light">Admin NEXA</p>
                <p className="text-[9px] text-gray-400">Administrador</p>
              </div>
              <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-[10px] tracking-widest">
                AN
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-5 md:p-7 h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <TimezoneSidebar />
    </div>
  );
}