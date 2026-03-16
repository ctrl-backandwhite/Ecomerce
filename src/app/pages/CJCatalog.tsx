import { useState, useEffect, useCallback } from "react";
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, AlertTriangle, Package, LayoutGrid, List,
} from "lucide-react";
import { useCJ } from "../context/CJContext";
import { CJProductCard } from "../components/CJProductCard";
import type { ListCJProductsParams } from "../services/cjApi";

const PAGE_SIZE = 20;

const ORDER_OPTIONS = [
  { value: "",            label: "Relevancia" },
  { value: "PRICE_ASC",  label: "Precio: menor a mayor" },
  { value: "PRICE_DESC", label: "Precio: mayor a menor" },
  { value: "CREATED_AT", label: "Más recientes" },
] as const;

export function CJCatalog() {
  const {
    categories, categoriesLoading, categoriesError, loadCategories,
    products, productsTotal, productsPage, productsLoading, productsError,
    fetchProducts,
  } = useCJ();

  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [orderBy,     setOrderBy]     = useState<ListCJProductsParams["orderBy"] | "">("");
  const [page,        setPage]        = useState(1);
  const [view,        setView]        = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalPages = Math.ceil(productsTotal / PAGE_SIZE);

  /* ── Carga inicial ─────────────────────────────────────────── */
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /* ── Recarga productos al cambiar filtros ──────────────────── */
  const doFetch = useCallback(
    (p = 1) => {
      const params: ListCJProductsParams = { page: p, size: PAGE_SIZE };
      if (search)     params.keyWord    = search;
      if (categoryId) params.categoryId = categoryId;
      if (orderBy)    params.orderBy    = orderBy as ListCJProductsParams["orderBy"];
      fetchProducts(params);
      setPage(p);
    },
    [search, categoryId, orderBy, fetchProducts],
  );

  useEffect(() => {
    doFetch(1);
  }, [search, categoryId, orderBy]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Búsqueda con debounce ─────────────────────────────────── */
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
    setOrderBy("");
    setPage(1);
  }

  const hasFilters = search || categoryId || orderBy;

  /* ── Sidebar de categorías ─────────────────────────────────── */
  const CategorySidebar = (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider px-2 mb-1">
        Categorías
      </p>

      {categoriesLoading && (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
          Cargando...
        </div>
      )}

      {categoriesError && (
        <div className="flex items-start gap-2 px-2 py-2 text-xs text-red-500">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          {categoriesError}
        </div>
      )}

      {!categoriesLoading && !categoriesError && (
        <>
          <button
            onClick={() => setCategoryId("")}
            className={`text-left px-3 py-2 text-xs rounded-lg transition-colors ${
              !categoryId
                ? "bg-gray-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setCategoryId(cat.categoryId)}
              className={`text-left px-3 py-2 text-xs rounded-lg transition-colors truncate ${
                categoryId === cat.categoryId
                  ? "bg-gray-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">

            {/* Título */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-sm text-gray-900 leading-none">Dropshipping</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Catálogo de proveedores</p>
              </div>
            </div>

            {/* Búsqueda */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar en catálogo..."
                  className="w-full h-8 pl-8 pr-3 text-xs text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setSearch(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </form>

            {/* Orden */}
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value as any)}
              className="h-8 px-2.5 text-xs text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white hidden sm:block"
            >
              {ORDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Vista */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-0.5 hidden sm:flex">
              <button
                onClick={() => setView("grid")}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${view === "grid" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${view === "list" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Filtros mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 h-8 px-3 text-xs text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              Filtros
            </button>
          </div>

          {/* Filtros activos */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {search && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
                  "{search}"
                  <button onClick={() => { setSearch(""); setSearchInput(""); }}>
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </span>
              )}
              {categoryId && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
                  {categories.find((c) => c.categoryId === categoryId)?.categoryName ?? categoryId}
                  <button onClick={() => setCategoryId("")}>
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              {CategorySidebar}
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">

            {/* Total y estado */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400">
                {productsLoading
                  ? "Cargando..."
                  : `${productsTotal.toLocaleString()} productos`}
              </p>
              {productsLoading && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" strokeWidth={1.5} />
              )}
            </div>

            {/* Error */}
            {productsError && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertTriangle className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-gray-500 mb-1">Error al cargar el catálogo</p>
                <p className="text-xs text-gray-400 mb-4 max-w-sm">{productsError}</p>
                <button
                  onClick={() => doFetch(page)}
                  className="flex items-center gap-1.5 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Reintentar
                </button>
              </div>
            )}

            {/* Grid de productos */}
            {!productsError && (
              <>
                {productsLoading && products.length === 0 ? (
                  /* Skeleton */
                  <div className={`grid gap-3 ${view === "list" ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"}`}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gray-100" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-2 bg-gray-100 rounded w-1/2" />
                          <div className="h-2 bg-gray-100 rounded" />
                          <div className="h-2 bg-gray-100 rounded w-3/4" />
                          <div className="flex justify-between mt-3">
                            <div className="h-4 bg-gray-100 rounded w-14" />
                            <div className="h-7 bg-gray-100 rounded-lg w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 && !productsLoading ? (
                  /* Vacío */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Package className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-gray-500 mb-1">Sin resultados</p>
                    <p className="text-xs text-gray-400">Prueba con otros términos de búsqueda</p>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 flex items-center gap-1.5 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={`grid gap-3 ${
                      view === "list"
                        ? "grid-cols-1"
                        : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                    } ${productsLoading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {products.map((p) => (
                      <CJProductCard key={p.pid} product={p} />
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && !productsError && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => doFetch(page - 1)}
                      disabled={page <= 1 || productsLoading}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    {/* Páginas */}
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let p: number;
                      if (totalPages <= 7) {
                        p = i + 1;
                      } else if (page <= 4) {
                        p = i + 1;
                      } else if (page >= totalPages - 3) {
                        p = totalPages - 6 + i;
                      } else {
                        p = page - 3 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => doFetch(p)}
                          disabled={productsLoading}
                          className={`w-8 h-8 text-xs rounded-xl transition-colors disabled:cursor-not-allowed ${
                            p === page
                              ? "bg-gray-600 text-white"
                              : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => doFetch(page + 1)}
                      disabled={page >= totalPages || productsLoading}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    <span className="text-xs text-gray-400 ml-2">
                      Pág. {page} de {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm text-gray-900">Filtros</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Orden mobile */}
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Ordenar por</p>
                <div className="space-y-1">
                  {ORDER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => { setOrderBy(o.value as any); setSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                        orderBy === o.value ? "bg-gray-600 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorías mobile */}
              <div>{CategorySidebar}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}