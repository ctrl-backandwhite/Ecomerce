import { Loader2, Search, SlidersHorizontal, X, ChevronRight, Gift } from "lucide-react";
import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { ProductCard } from "../components/ProductCard";
import { PromoSlider, type PromoFilter } from "../components/PromoSlider";
import { InfoBanner } from "../components/InfoBanner";
import { CategoryBar } from "../components/CategoryBar";
import { HomeSidebar } from "../components/HomeSidebar";
import { products, priceRanges, categoryTree } from "../data/products";
import { ATTR_MATCH, CATEGORY_ATTR_FILTERS } from "../data/filters";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const PAGE_SIZE = 8;

function scrollToProducts() {
  const el = document.getElementById("productos");
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category")    || "Todos";
  const searchQuery      = searchParams.get("search")      || "";
  const soloOfertas      = searchParams.get("ofertas")     === "true";
  const selectedSubcat   = searchParams.get("subcategory") || "";
  const selectedBrand    = searchParams.get("brand")       || "";
  const selectedAttr     = searchParams.get("attr")        || "";

  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [selectedRating,   setSelectedRating]   = useState(0);
  const [sortBy,           setSortBy]           = useState("featured");
  const [visibleCount,     setVisibleCount]     = useState(PAGE_SIZE);
  const [isLoading,        setIsLoading]        = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);

  const [promoClickKey, setPromoClickKey] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Filtered list ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...products];

    if (soloOfertas)
      list = list.filter((p) => p.originalPrice !== undefined);

    if (selectedCategory !== "Todos")
      list = list.filter((p) => p.category === selectedCategory);

    if (selectedSubcat)
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
      case "price-low":  list.sort((a, b) => a.price - b.price); break;
      case "price-high": list.sort((a, b) => b.price - a.price); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
      case "name":       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [selectedCategory, selectedSubcat, selectedBrand, selectedAttr,
      selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  /* ── Reset visibleCount when filters change ─────────────────── */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedSubcat, selectedBrand, selectedAttr,
      selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas]);

  /* ── Scroll to products when promo CTA is clicked ───────────── */
  useEffect(() => {
    if (promoClickKey > 0) scrollToProducts();
  }, [promoClickKey]);

  /* ── Infinite scroll via IntersectionObserver ──────────────── */
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE);
      setIsLoading(false);
    }, 600);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  /* ── Promo CTA handler ──────────────────────────────────────── */
  const handlePromoCta = useCallback((params: PromoFilter) => {
    const next: Record<string, string> = {};
    if (params.category) next.category = params.category;
    if (params.ofertas)  next.ofertas  = params.ofertas;
    setSearchParams(next);
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    setPromoClickKey((k) => k + 1);
  }, [setSearchParams]);

  /* ── Other handlers ─────────────────────────────────────────── */
  const handleCategory = (cat: string) => {
    const next = new URLSearchParams();
    if (cat !== "Todos") next.set("category", cat);
    // clear subcategory, brand, attr when category changes
    setSearchParams(next);
  };

  const handleSubcategory = (cat: string, sub: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("category", cat);
    if (sub === selectedSubcat) next.delete("subcategory");
    else next.set("subcategory", sub);
    next.delete("attr"); // reset attr filter on subcategory change
    setSearchParams(next);
  };

  const handleBrand = (brand: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!brand) next.delete("brand");
    else next.set("brand", brand);
    setSearchParams(next);
  };

  const handleAttr = (attr: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!attr) next.delete("attr");
    else next.set("attr", attr);
    setSearchParams(next);
  };

  const handleReset = () => {
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    setSearchParams({});
  };

  /* ── Subcategory quick-chips (for the content area) ─────────── */
  const currentCatNode = categoryTree.find((c) => c.name === selectedCategory);
  const subcategoryChips = useMemo(() => {
    if (!currentCatNode) return [];
    return currentCatNode.subcategories.filter((sub) =>
      products.some((p) => p.category === selectedCategory && p.subcategory === sub)
    );
  }, [currentCatNode, selectedCategory]);

  /* ── Category-specific quick-attr chips ─────────────────────── */
  const categoryAttrGroups = CATEGORY_ATTR_FILTERS[selectedCategory] ?? [];

  /* ── Active filter pills ───────────────────────────────────── */
  const pills = [
    soloOfertas && selectedCategory !== "Todos" && {
      label: `Ofertas · ${selectedCategory}`,
      clear: () => setSearchParams({}),
    },
    soloOfertas && selectedCategory === "Todos" && {
      label: "Ofertas",
      clear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("ofertas"); setSearchParams(p); },
    },
    !soloOfertas && selectedCategory !== "Todos" && {
      label: selectedCategory,
      clear: () => handleCategory("Todos"),
    },
    selectedSubcat && {
      label: selectedSubcat,
      clear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("subcategory"); setSearchParams(p); },
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
      clear: () => setSearchParams({}),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const hasFilters = pills.length > 0;

  /* ── Heading label ──────────────────────────────────────────── */
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
      <div className="bg-gray-900 text-white">
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
              {["25€", "50€", "100€", "200€"].map(a => (
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

      {/* ── Products + Sidebar ── */}
      <section className="py-12 bg-white border-t border-gray-200" id="productos">
        <div className="w-full">
          <div className="flex gap-6 items-start">

            {/* LEFT — Sidebar (desktop) */}
            <div className="pl-4 sm:pl-6 lg:pl-8">
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
            <div className="flex-1 min-w-0 pr-4 sm:pr-6 lg:pr-8">

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

                  {/* Title */}
                  <div>
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
                      onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.delete("subcategory"); p.delete("attr"); setSearchParams(p); }}
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${
                        !selectedSubcat
                          ? "border-gray-900 bg-gray-900 text-white"
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
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                            isActive
                              ? "border-gray-900 bg-gray-900 text-white"
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
                    {/* Attr quick-chips per group */}
                    {categoryAttrGroups.length > 0 && (
                      <span className="w-px h-4 bg-gray-200 mx-1" />
                    )}
                    {categoryAttrGroups.map((group) =>
                      group.options
                        .filter((opt) => {
                          const matchFn = ATTR_MATCH[selectedCategory]?.[opt];
                          return matchFn
                            ? products.some(
                                (p) => p.category === selectedCategory && matchFn(p)
                              )
                            : false;
                        })
                        .map((opt) => {
                          const isActive = selectedAttr === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => handleAttr(isActive ? "" : opt)}
                              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${
                                isActive
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
                    {/* Divider */}
                    {selectedCategory !== "Todos" && (
                      <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {filtered.length} resultados
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Grid */}
              {filtered.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                    {visible.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Sentinel + loader */}
                  <div ref={sentinelRef} className="mt-12 flex items-center justify-center min-h-[48px]">
                    {isLoading && (
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
                </>
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
                    className="text-sm px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🚚", title: "Envío Gratis",   sub: "En compras sobre $100" },
              { icon: "🔒", title: "Compra Segura",  sub: "Protección garantizada" },
              { icon: "💳", title: "Pago Fácil",     sub: "Múltiples métodos" },
              { icon: "🎧", title: "Soporte 24/7",   sub: "Siempre disponible" },
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

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <span className="text-sm tracking-wide text-gray-900">Filtros</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors" />
              </button>
            </div>
            <HomeSidebar
              selectedCategory={selectedCategory}
              selectedSubcat={selectedSubcat}
              selectedBrand={selectedBrand}
              selectedAttr={selectedAttr}
              selectedPriceIdx={selectedPriceIdx}
              selectedRating={selectedRating}
              sortBy={sortBy}
              total={filtered.length}
              onCategory={(cat) => { handleCategory(cat); setMobileOpen(false); }}
              onSubcategory={(cat, sub) => { handleSubcategory(cat, sub); setMobileOpen(false); }}
              onBrand={handleBrand}
              onAttr={handleAttr}
              onPrice={setSelectedPriceIdx}
              onRating={setSelectedRating}
              onSort={setSortBy}
              onReset={() => { handleReset(); setMobileOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}