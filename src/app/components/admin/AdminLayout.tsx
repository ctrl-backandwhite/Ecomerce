import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AdminSidebar } from "./AdminSidebar";
import { Bell, Search, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin":               "Dashboard",
  "/admin/productos":     "Productos",
  "/admin/categorias":    "Categorías",
  "/admin/medios":        "Galería de Medios",
  "/admin/ordenes":       "Órdenes",
  "/admin/clientes":      "Clientes",
  "/admin/configuracion": "Configuración",
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] ?? "Admin";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Page title */}
            <h1 className="text-sm text-gray-900 tracking-wide hidden sm:block flex-shrink-0">
              {pageTitle}
            </h1>

            {/* Divider */}
            <span className="hidden sm:block w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors placeholder-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications */}
            <button className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* Divider */}
            <span className="w-px h-5 bg-gray-200" />

            {/* Admin avatar */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <p className="text-xs text-gray-900">Admin NEXA</p>
                <p className="text-[10px] text-gray-400">Administrador</p>
              </div>
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs tracking-widest">
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
    </div>
  );
}