import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  Tag,
  TrendingUp,
  Star,
  SlidersHorizontal,
  X,
  ShoppingBag,
  Check,
  Layers,
  Cpu,
} from "lucide-react";
import { categoryTree, products, priceRanges } from "../data/products";
import { CATEGORY_ATTR_FILTERS, ATTR_MATCH } from "../data/filters";

interface HomeSidebarProps {
  selectedCategory: string;
  selectedSubcat: string;
  selectedBrand: string;
  selectedAttr: string;
  selectedPriceIdx: number;
  selectedRating: number;
  total: number;
  onCategory: (cat: string) => void;
  onSubcategory: (cat: string, sub: string) => void;
  onBrand: (brand: string) => void;
  onAttr: (attr: string) => void;
  onPrice: (idx: number) => void;
  onRating: (r: number) => void;
  onReset: () => void;
}

/* ── Top rated mini-widget ───────────────────────────────────── */
function TopRated() {
  const top = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] tracking-widest uppercase text-gray-400">
          Más valorados
        </span>
      </div>
      {top.map((p) => (
        <Link
          key={p.id}
          to={`/producto/${p.id}`}
          state={{ from: window.location.pathname + window.location.search }}
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
        >
          <img
            src={p.image}
            alt={p.name}
            className="w-10 h-10 object-cover rounded flex-shrink-0 bg-gray-100"
          />
          <div className="min-w-0">
            <p className="text-xs text-gray-800 leading-snug line-clamp-1 group-hover:text-gray-600 transition-colors">
              {p.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-gray-500">{p.rating}</span>
              <span className="text-[11px] text-gray-400">· ${p.price}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────── */
export function HomeSidebar({
  selectedCategory,
  selectedSubcat,
  selectedBrand,
  selectedAttr,
  selectedPriceIdx,
  selectedRating,
  total,
  onCategory,
  onSubcategory,
  onBrand,
  onAttr,
  onPrice,
  onRating,
  onReset,
}: HomeSidebarProps) {
  const [openCats, setOpenCats] = useState<string[]>(
    selectedCategory !== "Todos" ? [selectedCategory] : []
  );

  /* Auto-expand the selected category when it changes externally */
  useEffect(() => {
    if (selectedCategory !== "Todos") {
      setOpenCats((prev) =>
        prev.includes(selectedCategory) ? prev : [...prev, selectedCategory]
      );
    }
  }, [selectedCategory]);

  const toggle = (name: string) =>
    setOpenCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  /* ── Brands in scope ───────────────────────────────────────── */
  const brandsInScope = useMemo(() => {
    const base =
      selectedCategory === "Todos"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const map: Record<string, number> = {};
    base.forEach((p) => {
      if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [selectedCategory]);

  /* ── Category-specific attribute filters ─────────────────── */
  const categoryFilters = CATEGORY_ATTR_FILTERS[selectedCategory] ?? [];

  /* Count per attr option (based on full category scope, no other attr filter) */
  const attrCounts = useMemo(() => {
    const base =
      selectedCategory === "Todos"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const counts: Record<string, number> = {};
    categoryFilters.forEach((group) => {
      group.options.forEach((opt) => {
        const matchFn = ATTR_MATCH[selectedCategory]?.[opt];
        counts[opt] = matchFn ? base.filter(matchFn).length : 0;
      });
    });
    return counts;
  }, [selectedCategory, categoryFilters]);

  const hasFilters =
    selectedCategory !== "Todos" ||
    selectedPriceIdx !== 0 ||
    selectedRating !== 0 ||
    !!selectedBrand ||
    !!selectedAttr;

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4 flex flex-col gap-4">

        {/* ── Offer banner ─────────────────────────────────── */}
        <div className="bg-gray-900 rounded-lg p-4 text-white">
          <p className="text-[10px] tracking-widest uppercase text-white/50 mb-1">
            Oferta del día
          </p>
          <p className="text-sm mb-3 leading-snug">
            Hasta 30% OFF en Electrónica
          </p>
          <button
            onClick={() => onCategory("Electrónica")}
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors border-b border-white/20 hover:border-white/60 pb-0.5"
          >
            Ver ofertas
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* ── Filters panel ────────────────────────────────── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] tracking-widest uppercase text-gray-400">
                Filtros
              </span>
            </div>
            {hasFilters && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>

          {/* Result count */}
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
            <span className="text-[11px] text-gray-400">
              <span className="text-gray-900">{total}</span> productos
            </span>
          </div>

          {/* ── Categorías ── */}
          <div className="border-b border-gray-100">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
              <Tag className="w-3 h-3" /> Categorías
            </p>

            {/* Todos */}
            <button
              onClick={() => onCategory("Todos")}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                selectedCategory === "Todos"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag
                  className={`w-4 h-4 flex-shrink-0 ${selectedCategory === "Todos" ? "text-white" : "text-gray-400"}`}
                  strokeWidth={1.5}
                />
                Todos
              </span>
              <span className={`text-[10px] ${selectedCategory === "Todos" ? "text-white/50" : "text-gray-400"}`}>
                {products.length}
              </span>
            </button>

            {categoryTree.map((cat) => {
              const isActive = selectedCategory === cat.name;
              const isOpen   = openCats.includes(cat.name);
              const count    = products.filter((p) => p.category === cat.name).length;
              const CatIcon  = cat.icon;

              return (
                <div key={cat.name}>
                  <div
                    className={`flex items-center transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onCategory(cat.name);
                        if (!isOpen) toggle(cat.name);
                      }}
                      className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                    >
                      <CatIcon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                        strokeWidth={1.5}
                      />
                      {cat.name}
                      <span className={`ml-auto text-[10px] ${isActive ? "text-white/50" : "text-gray-400"}`}>
                        {count}
                      </span>
                    </button>
                    {cat.subcategories.length > 0 && (
                      <button
                        onClick={() => toggle(cat.name)}
                        className="px-3 py-2.5"
                      >
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                          : <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
                      </button>
                    )}
                  </div>

                  {isOpen && cat.subcategories.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {cat.subcategories.map((sub) => {
                        const subCount = products.filter(
                          (p) => p.category === cat.name && p.subcategory === sub
                        ).length;
                        if (subCount === 0) return null;
                        const isSubActive = selectedSubcat === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => onSubcategory(cat.name, sub)}
                            className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-[13px] transition-colors ${
                              isSubActive
                                ? "text-gray-900 bg-gray-100"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSubActive
                                ? <Check className="w-3 h-3 text-gray-700 flex-shrink-0" strokeWidth={2} />
                                : <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />}
                              {sub}
                            </span>
                            {subCount > 0 && (
                              <span className="text-[10px] text-gray-400">
                                {subCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Marcas ── */}
          {brandsInScope.length > 1 && (
            <div className="border-b border-gray-100">
              <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
                <Layers className="w-3 h-3" /> Marcas
              </p>
              {brandsInScope.map(([brand, count]) => {
                const isActive = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    onClick={() => onBrand(isActive ? "" : brand)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${
                      isActive
                        ? "text-gray-900 bg-gray-50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive ? "border-gray-900 bg-gray-900" : "border-gray-300"
                      }`}>
                        {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
                      </span>
                      {brand}
                    </span>
                    <span className="text-[10px] text-gray-400">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Filtros de categoría ── */}
          {categoryFilters.map((group) => {
            const visibleOptions = group.options.filter(
              (opt) => (attrCounts[opt] ?? 0) > 0
            );
            if (visibleOptions.length < 2) return null;
            return (
              <div key={group.groupLabel} className="border-b border-gray-100">
                <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
                  <Cpu className="w-3 h-3" />
                  {group.groupLabel}
                </p>
                {visibleOptions.map((opt) => {
                  const isActive = selectedAttr === opt;
                  const cnt = attrCounts[opt] ?? 0;
                  return (
                    <button
                      key={opt}
                      onClick={() => onAttr(isActive ? "" : opt)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${
                        isActive
                          ? "text-gray-900 bg-gray-50"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive ? "border-gray-900 bg-gray-900" : "border-gray-300"
                        }`}>
                          {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
                        </span>
                        {opt}
                      </span>
                      <span className="text-[10px] text-gray-400">{cnt}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* ── Precio ── */}
          <div className="border-b border-gray-100">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400">
              Precio
            </p>
            {priceRanges.map((range, idx) => (
              <button
                key={idx}
                onClick={() => onPrice(idx)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${
                  selectedPriceIdx === idx
                    ? "text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {range.label}
                {selectedPriceIdx === idx && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                )}
              </button>
            ))}
          </div>

          {/* ── Valoración ── */}
          <div className="pb-2">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400">
              Valoración mínima
            </p>
            {([0, 4, 4.5, 4.8] as number[]).map((r) => (
              <button
                key={r}
                onClick={() => onRating(r)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${
                  selectedRating === r
                    ? "text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {r === 0 ? (
                    "Cualquiera"
                  ) : (
                    <>
                      <span className="text-amber-400 text-sm">★</span>
                      {r}+
                    </>
                  )}
                </span>
                {selectedRating === r && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Top rated ──────────────────────────────────────── */}
        <TopRated />
      </div>
    </aside>
  );
}
