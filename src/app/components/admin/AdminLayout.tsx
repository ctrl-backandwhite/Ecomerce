import { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTour } from "./AdminTour";
import { TimezoneSidebar } from "../TimezoneSidebar";
import { useTimezone } from "../../context/TimezoneContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Menu, Clock, User, LogOut, ChevronDown } from "lucide-react";
import {
  NotificationsPanel,
  DEFAULT_NOTIFICATIONS,
  type AppNotification,
} from "./NotificationsPanel";
import { Bell } from "lucide-react";

// Map pathname → sidebar i18n key. Kept in sync with the sidebar so the
// breadcrumb-style title in the topbar matches the nav label and follows
// the active locale.
const pageTitleKeys: Record<string, string> = {
  "/admin": "admin.sidebar.dashboard",
  "/admin/products": "admin.sidebar.products",
  "/admin/categories": "admin.sidebar.categories",
  "/admin/brands": "admin.sidebar.brands",
  "/admin/attributes": "admin.sidebar.attributes",
  "/admin/media": "admin.sidebar.media",
  "/admin/slides": "admin.sidebar.slides",
  "/admin/orders": "admin.sidebar.orders",
  "/admin/invoices": "admin.sidebar.invoices",
  "/admin/returns": "admin.sidebar.returns",
  "/admin/customers": "admin.sidebar.customers",
  "/admin/reviews": "admin.sidebar.reviews",
  "/admin/coupons": "admin.sidebar.coupons",
  "/admin/loyalty": "admin.sidebar.loyalty",
  "/admin/gift-cards": "admin.sidebar.giftCards",
  "/admin/campaigns": "admin.sidebar.campaigns",
  "/admin/newsletter": "admin.sidebar.newsletter",
  "/admin/seo": "admin.sidebar.seo",
  "/admin/warranties": "admin.sidebar.warranties",
  "/admin/flows": "admin.sidebar.flows",
  "/admin/shipping": "admin.sidebar.shipping",
  "/admin/taxes": "admin.sidebar.taxes",
  "/admin/emails": "admin.sidebar.emails",
  "/admin/notifications": "admin.sidebar.notifications",
  "/admin/settings": "admin.sidebar.settings",
  "/admin/reports": "admin.sidebar.reports",
  "/admin/pricing": "admin.sidebar.pricing",
  "/admin/currency-rates": "admin.sidebar.currencies",
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS);
  const { selectedCountry, toggleSidebar } = useTimezone();
  const { currency } = useCurrency();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    if (!confirm(t("admin.sidebar.confirmLogout"))) return;
    logout().catch(() => { /* logout handles redirect even on failure */ });
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : t("admin.header.defaultName");
  const displayRole = user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN")
    ? t("admin.role.admin")
    : t("admin.role.user");
  const initials = user?.firstName
    ? `${user.firstName[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "AN"
    : "AN";

  const pageTitleKey = pageTitleKeys[location.pathname];
  const pageTitle = pageTitleKey ? t(pageTitleKey) : "Admin";

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

            {/* Country / Currency / Timezone */}
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Horario por país"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-medium text-gray-500">{currency?.currencyCode ?? "USD"}</span>
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

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl hover:bg-gray-50 transition-colors px-1.5 py-1"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <div className="text-right hidden md:block">
                  <p className="text-[11px] text-gray-900 font-light">{displayName}</p>
                  <p className="text-[9px] text-gray-400">{displayRole}</p>
                </div>
                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-[10px] tracking-widest">
                  {initials}
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
              </button>
              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-900">{displayName}</p>
                    {user?.email && (
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    )}
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    role="menuitem"
                  >
                    <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t("admin.header.myProfile")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-gray-100"
                    role="menuitem"
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t("admin.header.logout")}
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