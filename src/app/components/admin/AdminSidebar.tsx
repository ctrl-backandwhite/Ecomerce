import { Link, useLocation } from "react-router";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, LogOut, Store, X, Tag,
  Image, Presentation, Menu, Bookmark, Sliders,
  Ticket, Star, RotateCcw, BarChart2, FileText,
  Truck, Percent, Search, Mail, Award, Gift, Send,
  Megaphone, Shield, GitBranch,
} from "lucide-react";

const menuGroups = [
  {
    label: "Panel",
    tourId: "tour-panel-group",
    items: [
      { title: "Dashboard",       icon: LayoutDashboard, path: "/admin" },
      { title: "Reportes",        icon: BarChart2,       path: "/admin/reportes" },
    ],
  },
  {
    label: "Ventas",
    tourId: "tour-ventas-group",
    items: [
      { title: "Órdenes",         icon: ShoppingCart,    path: "/admin/ordenes" },
      { title: "Facturas",        icon: FileText,        path: "/admin/facturas" },
      { title: "Devoluciones",    icon: RotateCcw,       path: "/admin/devoluciones" },
    ],
  },
  {
    label: "Clientes",
    tourId: "tour-clientes-group",
    items: [
      { title: "Clientes",        icon: Users,           path: "/admin/clientes" },
      { title: "Reseñas",         icon: Star,            path: "/admin/resenas" },
      { title: "Cupones",         icon: Ticket,          path: "/admin/cupones" },
      { title: "Fidelidad",       icon: Award,           path: "/admin/puntos" },
      { title: "Tarjetas regalo", icon: Gift,            path: "/admin/regalo" },
    ],
  },
  {
    label: "Catálogo",
    tourId: "tour-catalogo-group",
    items: [
      { title: "Productos",       icon: Package,         path: "/admin/productos" },
      { title: "Categorías",      icon: Tag,             path: "/admin/categorias" },
      { title: "Marcas",          icon: Bookmark,        path: "/admin/marcas" },
      { title: "Atributos",       icon: Sliders,         path: "/admin/atributos" },
      { title: "Medios",          icon: Image,           path: "/admin/medios" },
      { title: "Garantías",       icon: Shield,          path: "/admin/garantias" },
    ],
  },
  {
    label: "Marketing",
    tourId: "tour-marketing-group",
    items: [
      { title: "Campañas",        icon: Megaphone,       path: "/admin/campanas" },
      { title: "Newsletter",      icon: Send,            path: "/admin/newsletter" },
      { title: "SEO",             icon: Search,          path: "/admin/seo" },
      { title: "Slides Home",     icon: Presentation,    path: "/admin/slides" },
    ],
  },
  {
    label: "Sistema",
    tourId: "tour-sistema-group",
    items: [
      { title: "Flujos",          icon: GitBranch,       path: "/admin/flujos" },
      { title: "Envíos",          icon: Truck,           path: "/admin/envios" },
      { title: "Impuestos",       icon: Percent,         path: "/admin/impuestos" },
      { title: "Emails",          icon: Mail,            path: "/admin/emails" },
      { title: "Configuración",   icon: Settings,        path: "/admin/configuracion" },
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
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 min-h-screen flex flex-col transform transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-16" : "lg:w-60"} w-60`}
      >
        {/* Logo */}
        <div className={`py-4 border-b border-gray-100 flex items-center transition-all duration-300 ${
          isCollapsed ? "lg:px-2 justify-center" : "px-5 justify-between"
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
                  <p className="text-[13px] text-gray-900 tracking-widest font-light whitespace-nowrap">NEXA</p>
                  <p className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 whitespace-nowrap">Admin</p>
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
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.label} id={group.tourId} className="mb-5">
              {!isCollapsed && (
                <p className="px-5 mb-1.5 text-[10px] text-gray-400 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="h-px bg-gray-100 mx-2 mb-2" />}

              {group.items.map(({ title, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    title={isCollapsed ? title : undefined}
                    className={`flex items-center mx-2 rounded-xl text-[13px] transition-all group relative ${
                      isCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5"
                    } ${
                      active
                        ? "text-gray-900 bg-gray-50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-2.5"}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
                        isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
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
        <div className={`border-t border-gray-100 space-y-1 transition-all duration-300 ${
          isCollapsed ? "lg:p-2" : "p-4"
        }`}>
          <Link
            to="/"
            title={isCollapsed ? "Ver Tienda" : undefined}
            className={`w-full flex items-center rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
              isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2.5 px-3 py-2.5"
            }`}
          >
            <Store className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
              isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
            }`}>
              Ver Tienda
            </span>
          </Link>
          <button
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className={`w-full flex items-center rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors ${
              isCollapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2.5 px-3 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
              isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
            }`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}