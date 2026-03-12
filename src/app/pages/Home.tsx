import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { ProductCard } from "../components/ProductCard";
import { PromoSlider, type PromoFilter } from "../components/PromoSlider";
import { InfoBanner } from "../components/InfoBanner";
import { CategoryBar } from "../components/CategoryBar";
import { HomeSidebar } from "../components/HomeSidebar";
import { products, priceRanges } from "../data/products";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

const PAGE_SIZE = 8;

function scrollToProducts() {
  const el = document.getElementById("productos");
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "Todos";
  const searchQuery      = searchParams.get("search") || "";
  const soloOfertas      = searchParams.get("ofertas") === "true";
  const selectedSubcat   = searchParams.get("subcategory") || "";

  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [selectedRating,   setSelectedRating]   = useState(0);
  const [sortBy,           setSortBy]           = useState("featured");
  const [visibleCount,     setVisibleCount]     = useState(PAGE_SIZE);
  const [isLoading,        setIsLoading]        = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);

  /* Track when promo CTA was last clicked to trigger scroll */
  const [promoClickKey, setPromoClickKey] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Filtered list ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...products];

    /* Offers filter — can combine with category */
    if (soloOfertas)
      list = list.filter((p) => p.originalPrice !== undefined);

    /* Category filter — works independently AND together with soloOfertas */
    if (selectedCategory !== "Todos")
      list = list.filter((p) => p.category === selectedCategory);

    if (selectedSubcat)
      list = list.filter((p) => p.subcategory === selectedSubcat);

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
  }, [selectedCategory, selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas, selectedSubcat]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  /* ── Reset visibleCount when filters change ────────────────── */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas, selectedSubcat]);

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
    /* Build the new search params from the promo filter */
    const next: Record<string, string> = {};
    if (params.category) next.category = params.category;
    if (params.ofertas)  next.ofertas  = params.ofertas;
    setSearchParams(next);
    /* Reset local filters */
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    /* Trigger scroll effect */
    setPromoClickKey((k) => k + 1);
  }, [setSearchParams]);

  /* ── Other handlers ─────────────────────────────────────────── */
  const handleCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (cat === "Todos") next.delete("category");
    else next.set("category", cat);
    next.delete("subcategory");
    setSearchParams(next);
  };

  const handleReset = () => {
    setSelectedPriceIdx(0);
    setSelectedRating(0);
    setSortBy("featured");
    setSearchParams({});
  };

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
      clear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("category"); setSearchParams(p); },
    },
    selectedSubcat && {
      label: selectedSubcat,
      clear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("subcategory"); setSearchParams(p); },
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

      {/* ── Products + Sidebar ── */}
      <section className="py-12 bg-white border-t border-gray-200" id="productos">
        <div className="w-full">
          <div className="flex gap-6 items-start">

            {/* LEFT — Sidebar (desktop) */}
            <div className="pl-4 sm:pl-6 lg:pl-8">
              <HomeSidebar
                selectedCategory={selectedCategory}
                selectedPriceIdx={selectedPriceIdx}
                selectedRating={selectedRating}
                total={filtered.length}
                onCategory={handleCategory}
                onPrice={setSelectedPriceIdx}
                onRating={setSelectedRating}
                onReset={handleReset}
              />
            </div>

            {/* RIGHT — Product grid */}
            <div className="flex-1 min-w-0 pr-4 sm:pr-6 lg:pr-8">

              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
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
              selectedPriceIdx={selectedPriceIdx}
              selectedRating={selectedRating}
              total={filtered.length}
              onCategory={(cat) => { handleCategory(cat); setMobileOpen(false); }}
              onPrice={setSelectedPriceIdx}
              onRating={setSelectedRating}
              onReset={() => { handleReset(); setMobileOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
