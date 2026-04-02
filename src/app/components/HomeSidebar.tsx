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
  ArrowUpDown,
  DollarSign,
  Shirt,
  Snowflake,
  Sparkles,
  Baby,
  Heart,
  Wind,
  Zap,
  Scissors,
  Cpu,
  Watch,
  Sofa,
  Loader2,
  AlertCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { priceRanges } from "../config/priceRanges";
import { CATEGORY_ATTR_FILTERS, ATTR_MATCH } from "../config/filters";
import { useStore } from "../context/StoreContext";
import { useNexaCategories } from "../services/useNexaCategories";
import type { NexaCategory } from "../repositories/NexaCategoryRepository";

interface HomeSidebarProps {
  selectedCategory: string;
  selectedSubcat: string;
  selectedBrand: string;
  selectedAttr: string;
  selectedPriceIdx: number;
  selectedRating: number;
  sortBy: string;
  total: number;
  onCategory: (cat: string, catId?: string) => void;
  onSubcategory: (cat: string, sub: string, catId?: string, subId?: string) => void;
  onBrand: (brand: string) => void;
  onAttr: (attr: string) => void;
  onPrice: (idx: number) => void;
  onRating: (r: number) => void;
  onSort: (s: string) => void;
  onReset: () => void;
}

/* ── Top rated mini-widget ───────────────────────────────────── */
function TopRated() {
  const { products } = useStore();
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

/* ── Category icon resolver (matches CategoryBar logic) ──────────────────────── */

const ICON_RULES: [RegExp, LucideIcon][] = [
  // ── Top-level categories (matched first for precision) ─────────────────
  [/consumer electronics/i, Cpu],
  [/jewelry.*watch|watch.*jewelry/i, Watch],
  [/home.*garden|home.*furniture|garden/i, Sofa],
  [/health.*beauty|beauty.*hair/i, Sparkles],
  [/pet supplies|^pet\b/i, Heart],
  [/bags.*shoes|shoes.*bags/i, ShoppingBag],
  [/sports.*outdoor|outdoor.*sport/i, Zap],
  [/toys.*kid|kid.*bab|babies/i, Baby],
  // ── Generic keyword rules ─────────────────────────────────────────────────
  [/hoodie|sweatshirt/i, Shirt],
  [/women|mujer|lady|ladies|female/i, Heart],
  [/men'?s|hombre|male\b/i, Shirt],
  [/kid|child|children|boy|girl|junior|baby/i, Baby],
  [/suit|set\b|tracksuit|sportswear/i, Layers],
  [/accessori|hat\b|cap\b|scarf|glove|sock/i, Tag],
  [/sport|active|gym|fitness/i, Zap],
  [/winter|jacket|coat|down\b|thermal/i, Snowflake],
  [/dress|skirt|romper|jumpsuit/i, Sparkles],
  [/shirt|blouse|top\b|tee\b/i, Shirt],
  [/pant|jean|short\b|legging|bottom/i, Scissors],
  [/sweater|knit/i, Wind],
  [/watch|jewelry|jewel|ring|necklace/i, Watch],
  [/electronic|gadget|device|tech/i, Cpu],
  [/home|garden|furniture|kitchen/i, Sofa],
];

function getCategoryIcon(name: string): LucideIcon {
  for (const [re, icon] of ICON_RULES) {
    if (re.test(name)) return icon;
  }
  return ShoppingBag;
}

/* ── Main export ─────────────────────────────────────────────── */
export function HomeSidebar({
  selectedCategory,
  selectedSubcat,
  selectedBrand,
  selectedAttr,
  selectedPriceIdx,
  selectedRating,
  sortBy,
  total,
  onCategory,
  onSubcategory,
  onBrand,
  onAttr,
  onPrice,
  onRating,
  onSort,
  onReset,
}: HomeSidebarProps) {
  const { products } = useStore();
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

  /* ── Categories from NX036 API ──────────────────────────────── */
  const { categories: apiCategories, loading: catsLoading, error: catsError, refetch: catsRefetch } = useNexaCategories();

  /* ── Brands in scope ─────────────────────────────────────────── */
  const brandsInScope = useMemo(() => {
    if (selectedCategory === "Todos") return [];
    const base = products.filter((p) => {
      if (p.category !== selectedCategory) return false;
      if (selectedSubcat && p.subcategory !== selectedSubcat) return false;
      return true;
    });
    const map: Record<string, number> = {};
    base.forEach((p) => {
      if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [selectedCategory, selectedSubcat, products]);

  /* ── Category-specific attribute filters ──────────────────── */
  const categoryFilters = CATEGORY_ATTR_FILTERS[selectedCategory] ?? [];

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
  }, [selectedCategory, categoryFilters, products]);

  const hasFilters =
    selectedCategory !== "Todos" ||
    selectedPriceIdx !== 0 ||
    selectedRating !== 0 ||
    !!selectedBrand ||
    !!selectedAttr;

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4 flex flex-col gap-3">

        {/* ── Catalog banner ───────────────────────────────────── */}
        <div className="bg-gray-700 rounded-xl p-4 text-white">
          <p className="text-[10px] tracking-widest uppercase text-white/50 mb-1">
            Catálogo activo
          </p>
          <p className="text-sm mb-3 leading-snug">
            {products.length > 0
              ? `${products.length} productos disponibles`
              : "Cargando catálogo..."}
          </p>
          <button
            onClick={() => onCategory("Todos")}
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors border-b border-white/20 hover:border-white/60 pb-0.5"
          >
            Ver todos
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* ── Filters panel ────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">

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

          {/* ── Categorías ─────────────────────────────────────── */}
          <div className="border-b border-gray-100">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
              <Tag className="w-3 h-3" /> Categorías
            </p>

            {/* Todos */}
            <button
              onClick={() => onCategory("Todos")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${selectedCategory === "Todos"
                ? "bg-gray-600 text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag
                  className={`w-3.5 h-3.5 flex-shrink-0 ${selectedCategory === "Todos" ? "text-white" : "text-gray-400"}`}
                  strokeWidth={1.5}
                />
                Todos
              </span>
              <span className={`text-[10px] ${selectedCategory === "Todos" ? "text-white/50" : "text-gray-400"}`}>
                {products.length}
              </span>
            </button>

            {/* API Categories — loading state */}
            {catsLoading && (
              <div className="flex items-center justify-center gap-2 px-4 py-6">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-xs text-gray-400">Cargando categorías…</span>
              </div>
            )}

            {/* API Categories — error state */}
            {!catsLoading && catsError && (
              <div className="px-4 py-4 text-center">
                <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-500 mb-2">{catsError}</p>
                <button
                  onClick={catsRefetch}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reintentar
                </button>
              </div>
            )}

            {/* API Categories — data */}
            {!catsLoading && !catsError && apiCategories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              const isOpen = openCats.includes(cat.name);
              const CatIcon = getCategoryIcon(cat.name);
              const subCats = cat.subCategories ?? [];

              return (
                <div key={cat.id}>
                  <div
                    className={`flex items-center transition-colors ${isActive
                      ? "bg-gray-600 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <button
                      onClick={() => {
                        onCategory(cat.name, cat.id);
                        if (!isOpen) toggle(cat.name);
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-xs text-left"
                    >
                      <CatIcon
                        className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{cat.name}</span>
                      {subCats.length > 0 && (
                        <span className={`ml-auto text-[10px] flex-shrink-0 ${isActive ? "text-white/50" : "text-gray-400"}`}>
                          {subCats.length}
                        </span>
                      )}
                    </button>
                    {subCats.length > 0 && (
                      <button
                        onClick={() => toggle(cat.name)}
                        className="px-2.5 py-2"
                      >
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                          : <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
                      </button>
                    )}
                  </div>

                  {isOpen && subCats.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {subCats.map((sub) => {
                        const isSubActive = selectedSubcat === sub.name;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onSubcategory(cat.name, sub.name, cat.id, sub.id)}
                            className={`w-full flex items-center justify-between pl-6 pr-3 py-1.5 text-xs transition-colors ${isSubActive
                              ? "text-gray-900 bg-gray-100"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSubActive
                                ? <Check className="w-3 h-3 text-gray-700 flex-shrink-0" strokeWidth={2} />
                                : <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />}
                              <span className="truncate">{sub.name}</span>
                            </span>
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
          {brandsInScope.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400">
                Marcas
              </p>
              {brandsInScope.map(([brand, count]) => (
                <button
                  key={brand}
                  onClick={() => onBrand(selectedBrand === brand ? "" : brand)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${selectedBrand === brand
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedBrand === brand
                      ? <Check className="w-3 h-3 text-gray-700" strokeWidth={2} />
                      : <span className="w-1 h-1 rounded-full bg-gray-300" />}
                    <span className="truncate">{brand}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Atributos dinámicos ── */}
          {categoryFilters.length > 0 && (
            <div className="border-b border-gray-100">
              {categoryFilters.map((group) => {
                const opts = group.options.filter((o) => (attrCounts[o] ?? 0) > 0);
                if (opts.length === 0) return null;
                return (
                  <div key={group.groupLabel} className="pt-3 pb-2 px-4">
                    <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {group.groupLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {opts.map((opt) => {
                        const isActive = selectedAttr === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => onAttr(isActive ? "" : opt)}
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${isActive
                              ? "border-gray-600 bg-gray-600 text-white"
                              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                              }`}
                          >
                            {opt}
                            {isActive && <X className="w-2.5 h-2.5 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Precio ── */}
          <div className="border-b border-gray-100">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Precio
            </p>
            {priceRanges.map((range, i) => (
              <button
                key={range.label}
                onClick={() => onPrice(i)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${selectedPriceIdx === i
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  {selectedPriceIdx === i
                    ? <Check className="w-3 h-3 text-gray-700" strokeWidth={2} />
                    : <span className="w-1 h-1 rounded-full bg-gray-300" />}
                  {range.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── Valoración ── */}
          <div className="border-b border-gray-100">
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
              <Star className="w-3 h-3" /> Valoración
            </p>
            {[5, 4, 3, 2].map((r) => (
              <button
                key={r}
                onClick={() => onRating(selectedRating === r ? 0 : r)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${selectedRating === r
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {selectedRating === r
                  ? <Check className="w-3 h-3 text-gray-700 flex-shrink-0" strokeWidth={2} />
                  : <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= r ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                      strokeWidth={1}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500">y más</span>
              </button>
            ))}
          </div>

          {/* ── Ordenar ── */}
          <div>
            <p className="px-4 pt-3.5 pb-1.5 text-[10px] tracking-widest uppercase text-gray-400 flex items-center gap-2">
              <ArrowUpDown className="w-3 h-3" /> Ordenar
            </p>
            {[
              { val: "featured", label: "Destacados" },
              { val: "price-low", label: "Precio: menor a mayor" },
              { val: "price-high", label: "Precio: mayor a menor" },
              { val: "name", label: "Nombre A–Z" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => onSort(val)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${sortBy === val
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {sortBy === val
                  ? <Check className="w-3 h-3 text-gray-700 flex-shrink-0" strokeWidth={2} />
                  : <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />}
                {label}
              </button>
            ))}
          </div>

        </div>

        {/* ── Top rated ── */}
        <TopRated />

      </div>
    </aside>
  );
}
