import { useState, useRef, useEffect, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTour } from "./AdminTour";
import { TimezoneSidebar } from "../TimezoneSidebar";
import { useTimezone } from "../../context/TimezoneContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import { Menu, Clock, LogOut, User } from "lucide-react";
import {
  NotificationsPanel,
  type AppNotification,
} from "./NotificationsPanel";
import { Bell } from "lucide-react";
import { notificationRepository } from "../../repositories/NotificationRepository";
import { mapToAppNotification, loadReadIds, saveReadIds } from "./notificationMapper";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Productos",
  "/admin/categories": "Categorías",
  "/admin/brands": "Marcas",
  "/admin/attributes": "Atributos",
  "/admin/media": "Galería de Medios",
  "/admin/slides": "Slides Home",
  "/admin/orders": "Órdenes",
  "/admin/invoices": "Facturas",
  "/admin/returns": "Devoluciones",
  "/admin/customers": "Clientes",
  "/admin/reviews": "Reseñas",
  "/admin/coupons": "Cupones",
  "/admin/loyalty": "Programa de Fidelidad",
  "/admin/gift-cards": "Tarjetas Regalo",
  "/admin/campaigns": "Campañas",
  "/admin/newsletter": "Newsletter",
  "/admin/seo": "SEO & Meta datos",
  "/admin/warranties": "Garantías",
  "/admin/flows": "Flujos de trabajo",
  "/admin/shipping": "Envíos",
  "/admin/taxes": "Impuestos",
  "/admin/emails": "Plantillas de Email",
  "/admin/settings": "Configuración",
  "/admin/reports": "Reportes",
  "/admin/pricing": "Reglas de Precio",
  "/admin/currency-rates": "Monedas",
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { selectedCountry, toggleSidebar } = useTimezone();
  const { currency } = useCurrency();
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] ?? "Admin";

  useEffect(() => {
    let cancelled = false;
    const readIds = loadReadIds();

    async function load() {
      try {
        const page = await notificationRepository.findAll({ size: 50, sort: "createdAt,desc" });
        const content = (page as unknown as { content?: unknown[] }).content
          ?? (Array.isArray(page) ? (page as unknown[]) : []);
        if (!cancelled) {
          setNotifications((content as Parameters<typeof mapToAppNotification>[0][]).map(n => mapToAppNotification(n, readIds)));
        }
      } catch {
        if (!cancelled) setNotifications([]);
      }
    }

    load();
    const timer = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const persistReadIds = (notifs: AppNotification[]) => {
    saveReadIds(new Set(notifs.filter(n => n.read).map(n => n.id)));
  };

  const markRead = (id: string) => setNotifications(prev => {
    const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
    persistReadIds(next);
    return next;
  });
  const markAllRead = () => setNotifications(prev => {
    const next = prev.map(n => ({ ...n, read: true }));
    persistReadIds(next);
    return next;
  });
  const deleteNotif = async (id: string) => {
    try { await notificationRepository.delete(id); } catch { /* non-blocking */ }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const clearRead = () => setNotifications(prev => {
    const next = prev.filter(n => !n.read);
    persistReadIds(next);
    return next;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.nickName || user?.email || "Admin";
  const initials = (() => {
    const source = fullName || user?.email || "";
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("") || "AN";
  })();

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

            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Horario por país"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-medium text-gray-500">{currency?.currencyCode ?? "USD"}</span>
            </button>

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

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="text-right hidden md:block">
                  <p className="text-[11px] text-gray-900 font-light leading-tight">{displayName}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">Administrador</p>
                </div>
                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-[10px] tracking-widest">
                  {initials}
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-sm py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); void logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto scrollbar-thin">
          <div className="p-5 md:p-7 h-full">
            <Suspense fallback={<div className="flex items-center justify-center h-full min-h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" /></div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <TimezoneSidebar />
    </div>
  );
}
