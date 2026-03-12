import { Link, useLocation } from "react-router";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, LogOut, Store, X, Tag, ChevronRight,
  Image,
} from "lucide-react";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard",   icon: LayoutDashboard, path: "/admin" },
    ],
  },
  {
    label: "Comercio",
    items: [
      { title: "Órdenes",     icon: ShoppingCart, path: "/admin/ordenes" },
      { title: "Clientes",    icon: Users,        path: "/admin/clientes" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Productos",   icon: Package,      path: "/admin/productos" },
      { title: "Categorías",  icon: Tag,          path: "/admin/categorias" },
      { title: "Medios",      icon: Image,        path: "/admin/medios" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configuración", icon: Settings,   path: "/admin/configuracion" },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 min-h-screen flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900 tracking-widest">NEXA</p>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Admin</p>
            </div>
          </Link>
          <button
            className="lg:hidden w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-5 mb-1.5 text-[10px] text-gray-400 uppercase tracking-widest">
                {group.label}
              </p>
              {group.items.map(({ title, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={`flex items-center justify-between mx-2 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      {title}
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Store className="w-4 h-4" strokeWidth={1.5} />
            Ver Tienda
          </Link>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}