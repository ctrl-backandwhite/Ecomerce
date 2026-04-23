import { Link, useLocation } from "react-router";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, LogOut, Store, X, Tag,
  Image, Presentation, Menu, Bookmark, Sliders,
  Ticket, Star, RotateCcw, BarChart2, FileText,
  Truck, Percent, Search, Mail, Award, Gift, Send,
  Megaphone, Shield, GitBranch, Layers, Coins,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const menuGroups = [
  {
    labelKey: "admin.sidebar.group.panel",
    tourId: "tour-panel-group",
    items: [
      { titleKey: "admin.sidebar.dashboard", icon: LayoutDashboard, path: "/admin" },
      { titleKey: "admin.sidebar.reports", icon: BarChart2, path: "/admin/reports" },
    ],
  },
  {
    labelKey: "admin.sidebar.group.sales",
    tourId: "tour-ventas-group",
    items: [
      { titleKey: "admin.sidebar.orders", icon: ShoppingCart, path: "/admin/orders" },
      { titleKey: "admin.sidebar.invoices", icon: FileText, path: "/admin/invoices" },
      { titleKey: "admin.sidebar.returns", icon: RotateCcw, path: "/admin/returns" },
    ],
  },
  {
    labelKey: "admin.sidebar.group.customers",
    tourId: "tour-clientes-group",
    items: [
      { titleKey: "admin.sidebar.customers", icon: Users, path: "/admin/customers" },
      { titleKey: "admin.sidebar.reviews", icon: Star, path: "/admin/reviews" },
      { titleKey: "admin.sidebar.coupons", icon: Ticket, path: "/admin/coupons" },
      { titleKey: "admin.sidebar.loyalty", icon: Award, path: "/admin/loyalty" },
      { titleKey: "admin.sidebar.giftCards", icon: Gift, path: "/admin/gift-cards" },
    ],
  },
  {
    labelKey: "admin.sidebar.group.catalog",
    tourId: "tour-catalogo-group",
    items: [
      { titleKey: "admin.sidebar.products", icon: Package, path: "/admin/products" },
      { titleKey: "admin.sidebar.variants", icon: Layers, path: "/admin/variants" },
      { titleKey: "admin.sidebar.categories", icon: Tag, path: "/admin/categories" },
      { titleKey: "admin.sidebar.brands", icon: Bookmark, path: "/admin/brands" },
      { titleKey: "admin.sidebar.attributes", icon: Sliders, path: "/admin/attributes" },
      { titleKey: "admin.sidebar.media", icon: Image, path: "/admin/media" },
      { titleKey: "admin.sidebar.warranties", icon: Shield, path: "/admin/warranties" },
    ],
  },
  {
    labelKey: "admin.sidebar.group.marketing",
    tourId: "tour-marketing-group",
    items: [
      { titleKey: "admin.sidebar.campaigns", icon: Megaphone, path: "/admin/campaigns" },
      { titleKey: "admin.sidebar.newsletter", icon: Send, path: "/admin/newsletter" },
      { titleKey: "admin.sidebar.seo", icon: Search, path: "/admin/seo" },
      { titleKey: "admin.sidebar.slides", icon: Presentation, path: "/admin/slides" },
    ],
  },
  {
    labelKey: "admin.sidebar.group.system",
    tourId: "tour-sistema-group",
    items: [
      { titleKey: "admin.sidebar.flows", icon: GitBranch, path: "/admin/flows" },
      { titleKey: "admin.sidebar.shipping", icon: Truck, path: "/admin/shipping" },
      { titleKey: "admin.sidebar.taxes", icon: Percent, path: "/admin/taxes" },
      { titleKey: "admin.sidebar.pricing", icon: Percent, path: "/admin/pricing" },
      { titleKey: "admin.sidebar.currencies", icon: Coins, path: "/admin/currency-rates" },
      { titleKey: "admin.sidebar.emails", icon: Mail, path: "/admin/emails" },
      { titleKey: "admin.sidebar.notifications", icon: Send, path: "/admin/notifications" },
      { titleKey: "admin.sidebar.settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    if (!confirm(t("admin.sidebar.confirmLogout"))) return;
    logout().catch(() => { /* logout handles redirect even on failure */ });
  };

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        id="tour-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 min-h-screen flex flex-col transform transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${isCollapsed ? "lg:w-16" : "lg:w-60"} w-60`}
      >
        {/* Logo */}
        <div className={`py-4 border-b border-gray-100 flex items-center transition-all duration-300 ${isCollapsed ? "lg:px-2 justify-center" : "px-5 justify-between"
          }`}>
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            </button>
          ) : (
            <>
              <Link to="/admin" className="flex items-center gap-2.5" onClick={onClose}>
                <div className="w-7 h-7 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] text-gray-900 tracking-widest font-light whitespace-nowrap">NX036</p>
                  <p className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 whitespace-nowrap">{t("admin.sidebar.badgeAdmin")}</p>
                </div>
              </Link>
              <button
                className="hidden lg:flex w-7 h-7 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors -mr-1"
                onClick={onToggleCollapse}
              >
                <Menu className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Close button - Mobile */}
          <button
            className="lg:hidden w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {menuGroups.map((group) => (
            <div key={group.labelKey} id={group.tourId} className="mb-5">
              {!isCollapsed && (
                <p className="px-5 mb-1.5 text-[10px] text-gray-400 uppercase tracking-widest">
                  {t(group.labelKey)}
                </p>
              )}
              {isCollapsed && <div className="h-px bg-gray-100 mx-2 mb-2" />}

              {group.items.map(({ titleKey, icon: Icon, path }) => {
                const active = isActive(path);
                const title = t(titleKey);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    title={isCollapsed ? title : undefined}
                    className={`flex items-center mx-2 rounded-xl text-[13px] transition-all group relative ${isCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5"
                      } ${active
                        ? "text-gray-900 bg-gray-50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-2.5"}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                        }`}>
                        {title}
                      </span>
                    </div>
                    {active && !isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`border-t border-gray-100 space-y-1 transition-all duration-300 ${isCollapsed ? "lg:p-2" : "p-4"
          }`}>
          <Link
            to="/"
            title={isCollapsed ? t("admin.sidebar.viewStore") : undefined}
            className={`w-full flex items-center rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2.5 px-3 py-2.5"
              }`}
          >
            <Store className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
              }`}>
              {t("admin.sidebar.viewStore")}
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? t("admin.sidebar.logout") : undefined}
            className={`w-full flex items-center rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors ${isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2.5 px-3 py-2.5"
              }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
              }`}>
              {t("admin.sidebar.logout")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}