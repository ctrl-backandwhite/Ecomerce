import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router";
import {
  Gift,
  ChevronRight,
  SlidersHorizontal,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { FlashDeals } from "../components/FlashDeals";
import { ProductCard } from "../components/ProductCard";
import { PromoSlider, type PromoFilter } from "../components/PromoSlider";
import { InfoBanner } from "../components/InfoBanner";
import { CategoryBar } from "../components/CategoryBar";
import { HomeSidebar } from "../components/HomeSidebar";
import { MobileFilterDrawer } from "../components/MobileFilterDrawer";
import { priceRanges } from "../data/products";
import { ATTR_MATCH, CATEGORY_ATTR_FILTERS } from "../data/filters";
import { useNexaProducts } from "../services/useNexaProducts";
import { useNexaCategories } from "../services/useNexaCategories";
import { slugify, urls } from "../lib/urls";

const PAGE_SIZE = 24;

function scrollToProducts() {
  const el = document.getElementById("productos");
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

export function Home() {
  /* ── Path params (clean URLs) ──────────────────────────────── */
  const { catSlug, subcatSlug, query: routeQuery } = useParams<{
    catSlug?: string;
    subcatSlug?: string;
    query?: string;
  }>();
  const navigate = useNavigate();

  /* ── Resolve category/subcategory from slugs ───────────────── */
  const { categories } = useNexaCategories();

  const resolvedCategory = useMemo(() => {
    if (!catSlug) return null;
    return categories.find((c) => slugify(c.name) === catSlug) ?? null;
  }, [catSlug, categories]);

  const resolvedSubcategory = useMemo(() => {
    if (!subcatSlug || !resolvedCategory) return null;
    return resolvedCategory.subCategories.find((s) => slugify(s.name) === subcatSlug) ?? null;
  }, [subcatSlug, resolvedCategory]);

  /* ── Search params (legacy + secondary filters) ────────────── */
  const [searchParams, setSearchParams] = useSearchParams();

  // Path params take priority; search params kept for backwards compat
  const selectedCategory = resolvedCategory?.name ?? searchParams.get("category") ?? "Todos";
  const selectedCategoryId = resolvedCategory?.id ?? searchParams.get("categoryId") ?? undefined;
  const selectedSubcat = resolvedSubcategory?.name ?? searchParams.get("subcategory") ?? "";
  const selectedSubcategoryId = resolvedSubcategory?.id ?? searchParams.get("subcategoryId") ?? undefined;
  const searchQuery = routeQuery ? decodeURIComponent(routeQuery) : (searchParams.get("search") ?? "");
  const soloOfertas = searchParams.get("ofertas") === "true";
  const selectedBrand = searchParams.get("brand") ?? "";
  const selectedAttr = searchParams.get("attr") ?? "";

  // When a subcategory is selected, use its ID to filter; otherwise use the parent category ID
  const activeCategoryId = selectedSubcategoryId || selectedCategoryId;

  const {
    products,
    loading: productsLoading,
    loadingMore,
    error: productsError,
    hasMore,
    dataSource,
    loadMore: apiLoadMore,
    refetch: refreshProducts,
  } = useNexaProducts(activeCategoryId);

  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(0);
  const [promoClickKey, setPromoClickKey] = useState(0);

  /* ── Infinite-scroll refs (callback-ref pattern) ─────────────── */
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef(apiLoadMore);
  useEffect(() => { loadMoreRef.current = apiLoadMore; });

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: "400px" },
    );
    observerRef.current.observe(node);
  }, []);

  /* ── Filtered list (client-side filters on API-loaded products) ── */
  const filtered = useMemo(() => {
    let list = [...products];

    if (soloOfertas)
      list = list.filter((p) => p.originalPrice !== undefined);

    // Skip client-side subcategory filter when API already filtered by subcategoryId
    if (selectedSubcat && !selectedSubcategoryId)
      list = list.filter((p) => p.subcategory === selectedSubcat);

    if (selectedBrand)
      list = list.filter((p) => p.brand === selectedBrand);

    if (selectedAttr) {
      const matchFn = ATTR_MATCH[selectedCategory]?.[selectedAttr];
      if (matchFn) list = list.filter(matchFn);
    }

    const pr = priceRanges[selectedPriceIdx];
    if (selectedPriceIdx !== 0)
      list = list.filter((p) => p.price >= pr.min && p.price <= pr.max);

    if (selectedRating > 0)
      list = list.filter((p) => p.rating >= selectedRating);

    if (searchQuery)
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

    switch (sortBy) {
      case "price-low": list.sort((a, b) => a.price - b.price); break;
      case "price-high": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [selectedCategory, selectedSubcat, selectedBrand, selectedAttr,
    selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas, products]);

  /* ── Reset filterKey when local filters change ─────────────── */
  useEffect(() => {
    setFilterKey((k) => k + 1);
  }, [selectedCategory, selectedSubcat, selectedBrand, selectedAttr,
    selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas]);

  /* ── Scroll to products when category/subcategory/search changes from URL ── */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    scrollToProducts();
  }, [selectedCategory, selectedSubcat, searchQuery]);

  /* ── Scroll to products when promo CTA is clicked ───────────── */
  useEffect(() => {
    if (promoClickKey > 0) scrollToProducts();
  }, [promoClickKey]);

  /* ── Promo CTA handler ──────────────────────────────────────── */
  const handlePromoCta = useCallback((params: PromoFilter) => {
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    setPromoClickKey((k) => k + 1);
    if (params.category) {
      const dest = urls.category(params.category);
      if (params.ofertas) {
        navigate(dest);
        setSearchParams({ ofertas: params.ofertas });
      } else {
        navigate(dest);
      }
    } else if (params.ofertas) {
      setSearchParams({ ofertas: params.ofertas });
    }
  }, [navigate, setSearchParams]);

  /* ── Filter handlers ─────────────────────────────────────────── */
  const handleCategory = (cat: string, _catId?: string) => {
    if (cat === "Todos") {
      navigate(urls.store(), { preventScrollReset: true });
    } else {
      navigate(urls.category(cat), { preventScrollReset: true });
    }
  };

  const handleSubcategory = (cat: string, sub: string, _catId?: string, _subId?: string) => {
    if (sub === selectedSubcat) {
      // Toggle off — go back to parent category
      navigate(urls.category(cat), { preventScrollReset: true });
    } else {
      navigate(urls.subcategory(cat, sub), { preventScrollReset: true });
    }
  };

  const handleBrand = (brand: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!brand) next.delete("brand");
    else next.set("brand", brand);
    setSearchParams(next, { preventScrollReset: true });
  };

  const handleAttr = (attr: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!attr) next.delete("attr");
    else next.set("attr", attr);
    setSearchParams(next, { preventScrollReset: true });
  };

  const handleReset = () => {
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    navigate(urls.store(), { preventScrollReset: true });
  };

  /* ── Subcategory quick-chips ─────────────────────────────────── */
  const currentCatSubcategories = useMemo(() => {
    if (selectedCategory === "Todos") return [];
    return [...new Set(
      products
        .filter((p) => p.category === selectedCategory && p.subcategory)
        .map((p) => p.subcategory)
    )].sort();
  }, [selectedCategory, products]);

  const subcategoryChips = useMemo(() => {
    return currentCatSubcategories.filter((sub) =>
      products.some((p) => p.category === selectedCategory && p.subcategory === sub)
    );
  }, [currentCatSubcategories, selectedCategory, products]);

  /* ── Category-specific attr chips ───────────────────────────── */
  const categoryAttrGroups = CATEGORY_ATTR_FILTERS[selectedCategory] ?? [];

  /* ── Active filter pills ──────────────────────────────────────── */
  const pills = [
    soloOfertas && selectedCategory !== "Todos" && {
      label: `Ofertas · ${selectedCategory}`,
      clear: () => navigate(urls.store(), { preventScrollReset: true }),
    },
    soloOfertas && selectedCategory === "Todos" && {
      label: "Ofertas",
      clear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("ofertas"); setSearchParams(p, { preventScrollReset: true }); },
    },
    !soloOfertas && selectedCategory !== "Todos" && {
      label: selectedCategory,
      clear: () => handleCategory("Todos"),
    },
    selectedSubcat && {
      label: selectedSubcat,
      clear: () => navigate(urls.category(selectedCategory), { preventScrollReset: true }),
    },
    selectedBrand && {
      label: selectedBrand,
      clear: () => handleBrand(""),
    },
    selectedAttr && {
      label: selectedAttr,
      clear: () => handleAttr(""),
    },
    selectedPriceIdx !== 0 && {
      label: priceRanges[selectedPriceIdx].label,
      clear: () => setSelectedPriceIdx(0),
    },
    selectedRating > 0 && {
      label: `★ ${selectedRating}+`,
      clear: () => setSelectedRating(0),
    },
    searchQuery && {
      label: `"${searchQuery}"`,
      clear: () => navigate(urls.store(), { preventScrollReset: true }),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const hasFilters = pills.length > 0;

  /* ── Section title ───────────────────────────────────────────── */
  const sectionTitle = (() => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (soloOfertas && selectedCategory !== "Todos") return `Ofertas · ${selectedCategory}`;
    if (soloOfertas) return "Ofertas y Descuentos";
    if (selectedSubcat) return selectedSubcat;
    if (selectedBrand && selectedCategory !== "Todos") return `${selectedBrand} · ${selectedCategory}`;
    if (selectedBrand) return selectedBrand;
    if (selectedAttr) return selectedAttr;
    if (selectedCategory !== "Todos") return selectedCategory;
    return "Todos los Productos";
  })();

  return (
    <div className="min-h-screen">

      {/* Category Bar */}
      <CategoryBar />

      {/* Promo Slider */}
      <PromoSlider onCtaClick={handlePromoCta} />

      {/* Info Banner */}
      <InfoBanner />

      {/* Gift Card Banner */}
      <div className="hidden sm:block bg-gray-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-white tracking-tight text-lg">Tarjetas de regalo NEXA</p>
              <p className="text-white/60 text-sm mt-0.5">El regalo perfecto — envíalo directo al email de quien quieras</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
              {["25€", "50€", "100€", "200€"].map((a) => (
                <span key={a} className="bg-white/10 border border-white/20 rounded-full px-2.5 py-0.5">{a}</span>
              ))}
            </div>
            <Link
              to="/tarjetas-regalo"
              className="flex items-center gap-2 h-10 px-5 text-sm text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Regalar ahora
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Flash Deals */}
      <FlashDeals
        onVerOfertas={() => {
          setSelectedPriceIdx(0);
          setSelectedRating(0);
          setSortBy("featured");
          setPromoClickKey((k) => k + 1);
          setSearchParams({ ofertas: "true" }, { preventScrollReset: true });
        }}
      />

      {/* ── Products + Sidebar ── */}
      <section className="py-12 bg-white border-t border-gray-200" id="productos">
        <div className="w-full">
          <div className="flex gap-6 items-start">

            {/* LEFT — Sidebar (desktop only) */}
            <div className="pl-4 sm:pl-6 lg:pl-8 hidden lg:block flex-shrink-0">
              <HomeSidebar
                selectedCategory={selectedCategory}
                selectedSubcat={selectedSubcat}
                selectedBrand={selectedBrand}
                selectedAttr={selectedAttr}
                selectedPriceIdx={selectedPriceIdx}
                selectedRating={selectedRating}
                sortBy={sortBy}
                total={filtered.length}
                onCategory={handleCategory}
                onSubcategory={handleSubcategory}
                onBrand={handleBrand}
                onAttr={handleAttr}
                onPrice={setSelectedPriceIdx}
                onRating={setSelectedRating}
                onSort={setSortBy}
                onReset={handleReset}
              />
            </div>

            {/* RIGHT — Product grid */}
            <div className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-0 lg:pr-8">

              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">

                  {/* Mobile filter btn */}
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                  </button>

                  {/* Title — desktop only */}
                  <div className="hidden lg:block">
                    <h2 className="text-xl tracking-tight text-gray-900">
                      {sectionTitle}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {filtered.length} productos
                    </p>
                  </div>

                  {/* Active pills */}
                  {hasFilters && (
                    <div className="flex flex-wrap gap-2">
                      {pills.map((pill, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full"
                        >
                          {pill.label}
                          <button onClick={pill.clear} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-400 cursor-pointer flex-shrink-0"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-low">Precio: menor a mayor</option>
                  <option value="price-high">Precio: mayor a menor</option>
                  <option value="rating">Mejor valorados</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </div>

              {/* ── Subcategory quick-chips ── */}
              {selectedCategory !== "Todos" && subcategoryChips.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(urls.category(selectedCategory), { preventScrollReset: true })}
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${!selectedSubcat
                        ? "border-gray-600 bg-gray-600 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                    >
                      Todos
                    </button>
                    {subcategoryChips.map((sub) => {
                      const count = products.filter(
                        (p) => p.category === selectedCategory && p.subcategory === sub
                      ).length;
                      const isActive = selectedSubcat === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => handleSubcategory(selectedCategory, sub)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${isActive
                            ? "border-gray-600 bg-gray-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                            }`}
                        >
                          {sub}
                          <span className={`text-[10px] ${isActive ? "text-white/60" : "text-gray-400"}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    {categoryAttrGroups.length > 0 && (
                      <span className="w-px h-4 bg-gray-200 mx-1" />
                    )}
                    {categoryAttrGroups.map((group) =>
                      group.options
                        .filter((opt) => {
                          const matchFn = ATTR_MATCH[selectedCategory]?.[opt];
                          return matchFn
                            ? products.some((p) => p.category === selectedCategory && matchFn(p))
                            : false;
                        })
                        .map((opt) => {
                          const isActive = selectedAttr === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => handleAttr(isActive ? "" : opt)}
                              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${isActive
                                ? "border-gray-700 bg-gray-700 text-white"
                                : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                            >
                              {opt}
                              {isActive && <X className="w-2.5 h-2.5 ml-0.5" />}
                            </button>
                          );
                        })
                    )}
                    {selectedCategory !== "Todos" && (
                      <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {filtered.length} resultados
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Data source badge ── */}
              {dataSource === "api" && (
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-gray-400">Catálogo en vivo</span>
                </div>
              )}
              {dataSource === "mock" && (
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-gray-400">Modo demo — datos de muestra</span>
                </div>
              )}

              {/* ── Error state ── */}
              {productsError && !productsLoading && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertTriangle className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-gray-500 mb-1">Error al cargar productos</p>
                  <p className="text-xs text-gray-400 mb-4 max-w-sm">{productsError}</p>
                  <button
                    onClick={() => refreshProducts()}
                    className="flex items-center gap-1.5 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Reintentar
                  </button>
                </div>
              )}

              {/* ── Initial loading skeleton ── */}
              {productsLoading && products.length === 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-100" />
                      <div className="p-3.5 space-y-2">
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded" />
                        <div className="h-2 bg-gray-100 rounded w-3/4" />
                        <div className="flex justify-between mt-4">
                          <div className="h-4 bg-gray-100 rounded w-14" />
                          <div className="h-7 bg-gray-100 rounded-xl w-18" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Product grid ── */}
              {!productsLoading || products.length > 0 ? (
                filtered.length > 0 ? (
                  <div key={filterKey} className="nexa-grid-enter">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      {filtered.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {/* Sentinel + loader */}
                    <div ref={sentinelRef} className="mt-12 flex items-center justify-center min-h-[48px]">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando más productos...
                        </div>
                      )}
                      {!hasMore && filtered.length > PAGE_SIZE && (
                        <p className="text-xs text-gray-300 tracking-widest uppercase">
                          Todos los productos cargados
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-lg text-gray-900 mb-2">Sin resultados</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Prueba ajustando los filtros o cambia la búsqueda
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-sm px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="py-4 sm:py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Mobile: solo iconos centrados */}
          <div className="flex sm:hidden items-center justify-around">
            {[
              { icon: "🚚" },
              { icon: "🔒" },
              { icon: "💳" },
              { icon: "🎧" },
            ].map(({ icon }, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg">
                {icon}
              </div>
            ))}
          </div>

          {/* Desktop: icono + texto */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🚚", title: "Envío Gratis", sub: "En compras sobre $100" },
              { icon: "🔒", title: "Compra Segura", sub: "Protección garantizada" },
              { icon: "💳", title: "Pago Fácil", sub: "Múltiples métodos" },
              { icon: "🎧", title: "Soporte 24/7", sub: "Siempre disponible" },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-lg">
                  {icon}
                </div>
                <div>
                  <p className="text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        selectedCategory={selectedCategory}
        selectedSubcat={selectedSubcat}
        selectedBrand={selectedBrand}
        selectedAttr={selectedAttr}
        selectedPriceIdx={selectedPriceIdx}
        selectedRating={selectedRating}
        sortBy={sortBy}
        total={filtered.length}
        onCategory={(cat, catId) => { handleCategory(cat, catId); setMobileOpen(false); }}
        onSubcategory={(cat, sub, catId, subId) => { handleSubcategory(cat, sub, catId, subId); setMobileOpen(false); }}
        onBrand={handleBrand}
        onAttr={handleAttr}
        onPrice={setSelectedPriceIdx}
        onRating={setSelectedRating}
        onSort={setSortBy}
        onReset={() => { handleReset(); setMobileOpen(false); }}
      />
    </div>
  );
}