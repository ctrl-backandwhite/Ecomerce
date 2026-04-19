import { useMemo } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  TrendingUp,
  Star,
  SlidersHorizontal,
  X,
  Check,
  Layers,
  ArrowUpDown,
  DollarSign,
  Gift,
} from "lucide-react";
import { usePriceRanges } from "../hooks/usePriceRanges";
import { CATEGORY_ATTR_FILTERS, ATTR_MATCH } from "../config/filters";
import { useNexaProducts } from "../hooks/useNexaProducts";
import { useCurrency } from "../context/CurrencyContext";

interface HomeSidebarProps {
  selectedCategory: string;
  selectedSubcat: string;
  selectedBrand: string;
  selectedAttr: string;
  selectedPriceIdx: number;
  selectedRating: number;
  sortBy: string;
  total: number;
  variantValues?: Record<string, string>;
  selectedKeywords?: string[];
  onCategory: (cat: string, catId?: string) => void;
  onBrand: (brand: string) => void;
  onAttr: (attr: string) => void;
  onPrice: (idx: number) => void;
  onRating: (r: number) => void;
  onSort: (s: string) => void;
  onReset: () => void;
  onVariantValue?: (attrName: string, value: string) => void;
  onToggleKeyword?: (kw: string) => void;
}

/* Generic attribute keys we never want to surface as filters */
const IGNORED_ATTR_KEYS = new Set(["default", "key", "sku", "id"]);

/* Stopwords excluded from keyword facets */
const KW_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "que", "para", "con", "por", "los", "las",
  "una", "uno", "del", "este", "esta", "todo", "todos", "pro", "new", "set", "pcs",
  "x", "de", "en", "un", "y", "o", "a", "al", "es", "la", "el",
]);

/* ── Top rated mini-widget ───────────────────────────────────── */
function TopRated() {
  const { products } = useNexaProducts();
  const { formatPrice } = useCurrency();
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
          to={`/product/${p.id}`}
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
              <span className="text-[11px] text-gray-400">· {formatPrice(p.price)}</span>
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
  sortBy,
  total,
  variantValues = {},
  selectedKeywords = [],
  onCategory,
  onBrand,
  onAttr,
  onPrice,
  onRating,
  onSort,
  onReset,
  onVariantValue,
  onToggleKeyword,
}: HomeSidebarProps) {
  const { products } = useNexaProducts();
  const priceRanges = usePriceRanges();

  /* ── Keyword facets mined from product names ──────────────────
   * When the listing doesn't expose variant attributes we still want
   * useful filters. Extract the most frequent non-stopword tokens from
   * the visible products and offer them as chips. "Wireless", "Bluetooth",
   * "USB" etc. fall out of this naturally. */
  const keywordFacets = useMemo(() => {
    const base = products.filter((p) => {
      if (selectedCategory !== "Todos" && p.category !== selectedCategory) return false;
      if (selectedSubcat && p.subcategory !== selectedSubcat) return false;
      return true;
    });
    if (base.length < 3) return [];
    const counts = new Map<string, number>();
    base.forEach((p) => {
      const seen = new Set<string>();
      p.name
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñ\s]/gi, " ")
        .split(/\s+/)
        .forEach((raw) => {
          const tok = raw.trim();
          if (tok.length < 4 || tok.length > 18) return;
          if (/^\d+$/.test(tok)) return;
          if (KW_STOPWORDS.has(tok)) return;
          if (seen.has(tok)) return;
          seen.add(tok);
          counts.set(tok, (counts.get(tok) ?? 0) + 1);
        });
    });
    return [...counts.entries()]
      .filter(([, n]) => n >= 2 && n < base.length)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw, n]) => ({ kw, count: n }));
  }, [products, selectedCategory, selectedSubcat]);

  /* ── Dynamic variant-attribute filters (brand-agnostic) ───────
   * Pulls the unique {attrName → values[]} map from the variants of the
   * products currently in scope. Also tags each value with its count so
   * we can render "Red (12)" style chips. */
  const variantAttrGroups = useMemo(() => {
    const base = products.filter((p) => {
      if (selectedCategory !== "Todos" && p.category !== selectedCategory) return false;
      if (selectedSubcat && p.subcategory !== selectedSubcat) return false;
      return true;
    });
    const map: Record<string, Map<string, number>> = {};
    base.forEach((p) => {
      p.variants?.forEach((v) => {
        Object.entries(v.attributes ?? {}).forEach(([k, val]) => {
          if (!val) return;
          const key = k.trim();
          if (!key || IGNORED_ATTR_KEYS.has(key.toLowerCase())) return;
          const values = map[key] ?? (map[key] = new Map<string, number>());
          values.set(String(val), (values.get(String(val)) ?? 0) + 1);
        });
      });
    });
    return Object.entries(map)
      .map(([name, values]) => ({
        name,
        values: [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
      }))
      .filter((g) => g.values.length > 1)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory, selectedSubcat]);

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

        {/* ── Gift-card banner ─────────────────────────────────── */}
        <Link
          to="/gift-cards"
          className="group bg-gray-700 rounded-xl p-4 text-white flex items-start gap-3 hover:bg-gray-800 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-widest uppercase text-white/50 mb-0.5">
              NX036 Gift Cards
            </p>
            <p className="text-sm leading-snug mb-2">
              Regala lo que quieran — envío directo por email
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/80 group-hover:text-white transition-colors border-b border-white/20 group-hover:border-white/60 pb-0.5">
              Regalar ahora
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

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

          {/* ── Keyword facets (from product names) ── */}
          {keywordFacets.length > 0 && onToggleKeyword && (
            <div className="border-b border-gray-100">
              <div className="pt-3 pb-2.5 px-4">
                <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Características
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywordFacets.map(({ kw, count }) => {
                    const isActive = selectedKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        onClick={() => onToggleKeyword(kw)}
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all capitalize ${isActive
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
                      >
                        <span>{kw}</span>
                        <span className={`text-[10px] ${isActive ? "text-white/60" : "text-gray-400"}`}>
                          {count}
                        </span>
                        {isActive && <X className="w-2.5 h-2.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Filtros dinámicos por variante ── */}
          {variantAttrGroups.length > 0 && onVariantValue && (
            <div className="border-b border-gray-100">
              {variantAttrGroups.map((group) => (
                <div key={group.name} className="pt-3 pb-2.5 px-4">
                  <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {group.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.values.map(([val, count]) => {
                      const isActive = variantValues[group.name] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => onVariantValue(group.name, isActive ? "" : val)}
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
                        >
                          <span className="truncate max-w-[120px]">{val}</span>
                          <span className={`text-[10px] ${isActive ? "text-white/60" : "text-gray-400"}`}>
                            {count}
                          </span>
                          {isActive && <X className="w-2.5 h-2.5 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
