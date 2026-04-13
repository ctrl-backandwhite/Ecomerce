import { useState, useEffect, useMemo } from "react";
import {
  X,
  SlidersHorizontal,
  Tag,
  Check,
  ChevronDown,
  ChevronRight,
  Star,
  DollarSign,
  ArrowUpDown,
  ShoppingBag,
  Shirt,
  Layers,
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
import { usePriceRanges } from "../hooks/usePriceRanges";
import { CATEGORY_ATTR_FILTERS, ATTR_MATCH } from "../config/filters";
import { useNexaProducts } from "../hooks/useNexaProducts";
import { useNexaCategories } from "../hooks/useNexaCategories";

// ── Icon resolver ─────────────────────────────────────────────────────────────
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/consumer electronics/i, Cpu],
  [/jewelry.*watch|watch.*jewelry/i, Watch],
  [/home.*garden|home.*furniture|garden/i, Sofa],
  [/health.*beauty|beauty.*hair/i, Sparkles],
  [/pet supplies|^pet\b/i, Heart],
  [/bags.*shoes|shoes.*bags/i, ShoppingBag],
  [/sports.*outdoor|outdoor.*sport/i, Zap],
  [/toys.*kid|kid.*bab|babies/i, Baby],
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

// ─────────────────────────────────────────────────────────────────────────────

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
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

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({
  label,
  icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-gray-400">
          {icon}
          {label}
        </span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
        }
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function MobileFilterDrawer({
  open,
  onClose,
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
}: MobileFilterDrawerProps) {
  const { products } = useNexaProducts();
  const priceRanges = usePriceRanges();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Category tree ───────────────────────────────────────────────
  const [openCats, setOpenCats] = useState<string[]>(
    selectedCategory !== "Todos" ? [selectedCategory] : []
  );
  const [openSubs, setOpenSubs] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCategory !== "Todos") {
      setOpenCats((prev) =>
        prev.includes(selectedCategory) ? prev : [...prev, selectedCategory]
      );
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubcat) {
      setOpenSubs((prev) =>
        prev.includes(selectedSubcat) ? prev : [...prev, selectedSubcat]
      );
    }
  }, [selectedSubcat]);

  const toggleCat = (name: string) =>
    setOpenCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const toggleSub = (name: string) =>
    setOpenSubs((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );

  // ── Categories from NX036 API ────────────────────────────────
  const { categories: apiCategories, loading: catsLoading, error: catsError, refetch: catsRefetch } = useNexaCategories();

  // ── Brands ─────────────────────────────────────────────────────
  const brandsInScope = useMemo(() => {
    if (selectedCategory === "Todos") return [];
    const base = products.filter((p) => {
      if (p.category !== selectedCategory) return false;
      if (selectedSubcat && p.subcategory !== selectedSubcat) return false;
      return true;
    });
    const map: Record<string, number> = {};
    base.forEach((p) => { if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [selectedCategory, selectedSubcat, products]);

  // ── Attributes ──────────────────────────────────────────────────
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

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer panel — slides from left */}
      <div className="relative w-[min(84vw,340px)] h-full bg-white flex flex-col shadow-2xl">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-sm text-gray-900">Filtros</span>
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={() => { onReset(); }}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Limpiar todo
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Categorías ───────────────────────────────────────── */}
          <Section label="Categorías" icon={<Tag className="w-3 h-3" />}>
            {/* Todos */}
            <button
              onClick={() => { onCategory("Todos"); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedCategory === "Todos"
                ? "bg-gray-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
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

            {/* API Categories — loading */}
            {catsLoading && (
              <div className="flex items-center justify-center gap-2 px-4 py-6">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-xs text-gray-400">Cargando…</span>
              </div>
            )}

            {/* API Categories — error */}
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
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <button
                      onClick={() => {
                        onCategory(cat.name, cat.id);
                        if (!isOpen) toggleCat(cat.name);
                      }}
                      className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                    >
                      <CatIcon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
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
                      <button onClick={() => toggleCat(cat.name)} className="px-3 py-2.5">
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                          : <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                        }
                      </button>
                    )}
                  </div>

                  {isOpen && subCats.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {subCats.map((sub) => {
                        const isSubActive = selectedSubcat === sub.name;
                        const subChildren = sub.subCategories ?? [];
                        const isSubOpen = openSubs.includes(sub.name);
                        return (
                          <div key={sub.id}>
                            <div className={`flex items-center transition-colors ${isSubActive
                              ? "text-gray-900 bg-gray-100"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              }`}>
                              <button
                                onClick={() => {
                                  onSubcategory(cat.name, sub.name, cat.id, sub.id);
                                  if (subChildren.length > 0 && !isSubOpen) toggleSub(sub.name);
                                }}
                                className="flex-1 flex items-center gap-2.5 pl-11 pr-1 py-2 text-[13px] text-left"
                              >
                                {isSubActive
                                  ? <Check className="w-3 h-3 text-gray-700 flex-shrink-0" strokeWidth={2} />
                                  : <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />}
                                <span className="truncate">{sub.name}</span>
                                {subChildren.length > 0 && (
                                  <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                                    {subChildren.length}
                                  </span>
                                )}
                              </button>
                              {subChildren.length > 0 && (
                                <button
                                  onClick={() => toggleSub(sub.name)}
                                  className="px-3 py-2"
                                >
                                  {isSubOpen
                                    ? <ChevronDown className="w-3 h-3 opacity-40" />
                                    : <ChevronRight className="w-3 h-3 opacity-40" />}
                                </button>
                              )}
                            </div>

                            {isSubOpen && subChildren.length > 0 && (
                              <div className="bg-white border-t border-gray-50">
                                {subChildren.map((child) => {
                                  const isChildActive = selectedSubcat === child.name;
                                  return (
                                    <button
                                      key={child.id}
                                      onClick={() => onSubcategory(cat.name, child.name, cat.id, child.id)}
                                      className={`w-full flex items-center gap-2 pl-14 pr-4 py-1.5 text-xs transition-colors ${isChildActive
                                        ? "text-gray-900 bg-gray-100"
                                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                        }`}
                                    >
                                      {isChildActive
                                        ? <Check className="w-2.5 h-2.5 text-gray-700 flex-shrink-0" strokeWidth={2} />
                                        : <span className="w-0.5 h-0.5 rounded-full bg-gray-300 flex-shrink-0" />}
                                      <span className="truncate">{child.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Section>

          {/* ── Precio ───────────────────────────────────────────── */}
          <Section label="Precio" icon={<DollarSign className="w-3 h-3" />}>
            {priceRanges.map((range, i) => (
              <button
                key={range.label}
                onClick={() => onPrice(i)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedPriceIdx === i
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
          </Section>

          {/* ── Valoración ───────────────────────────────────────── */}
          <Section label="Valoración" icon={<Star className="w-3 h-3" />}>
            {[5, 4, 3, 2].map((r) => (
              <button
                key={r}
                onClick={() => onRating(selectedRating === r ? 0 : r)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${selectedRating === r
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
          </Section>

          {/* ── Marcas ───────────────────────────────────────────── */}
          {brandsInScope.length > 0 && (
            <Section label="Marcas" icon={<Tag className="w-3 h-3" />} defaultOpen={false}>
              {brandsInScope.map(([brand, count]) => (
                <button
                  key={brand}
                  onClick={() => onBrand(selectedBrand === brand ? "" : brand)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedBrand === brand
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
            </Section>
          )}

          {/* ── Atributos dinámicos ──────────────────────────────── */}
          {categoryFilters.map((group) => {
            const opts = group.options.filter((o) => (attrCounts[o] ?? 0) > 0);
            if (opts.length === 0) return null;
            return (
              <Section
                key={group.groupLabel}
                label={group.groupLabel}
                icon={<Layers className="w-3 h-3" />}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-1.5 px-4 pb-1">
                  {opts.map((opt) => {
                    const isActive = selectedAttr === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => onAttr(isActive ? "" : opt)}
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${isActive
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
              </Section>
            );
          })}

          {/* ── Ordenar ──────────────────────────────────────────── */}
          <Section label="Ordenar" icon={<ArrowUpDown className="w-3 h-3" />} defaultOpen={false}>
            {[
              { val: "featured", label: "Destacados" },
              { val: "price-low", label: "Precio: menor a mayor" },
              { val: "price-high", label: "Precio: mayor a menor" },
              { val: "rating", label: "Mejor valorados" },
              { val: "name", label: "Nombre A–Z" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => onSort(val)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${sortBy === val
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
          </Section>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* ── Footer CTA ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-4 bg-white">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 h-11 bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-300 transition-colors rounded-xl text-sm"
          >
            Ver {total} resultado{total !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
