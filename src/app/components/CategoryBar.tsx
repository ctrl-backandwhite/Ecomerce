import { useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  Shirt,
  Layers,
  Tag,
  Zap,
  Snowflake,
  Sparkles,
  Baby,
  Heart,
  Wind,
  ShoppingBag,
  Scissors,
  Cpu,
  Watch,
  Sofa,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../context/StoreContext";

// ── Icon resolver by category name ───────────────────────────────────────────

const ICON_RULES: [RegExp, LucideIcon][] = [
  // ── CJ top-level categories (matched first for precision) ─────────────────
  [/consumer electronics/i,                 Cpu],
  [/jewelry.*watch|watch.*jewelry/i,        Watch],
  [/home.*garden|home.*furniture|garden/i,  Sofa],
  [/health.*beauty|beauty.*hair/i,          Sparkles],
  [/pet supplies|^pet\b/i,                  Heart],
  [/bags.*shoes|shoes.*bags/i,              ShoppingBag],
  [/sports.*outdoor|outdoor.*sport/i,       Zap],
  [/toys.*kid|kid.*bab|babies/i,            Baby],
  // ── Generic keyword rules ─────────────────────────────────────────────────
  [/hoodie|sweatshirt/i,                    Shirt],
  [/women|mujer|lady|ladies|female/i,       Heart],
  [/men'?s|hombre|male\b/i,                 Shirt],
  [/kid|child|children|boy|girl|junior|baby/i, Baby],
  [/suit|set\b|tracksuit|sportswear/i,      Layers],
  [/accessori|hat\b|cap\b|scarf|glove|sock/i, Tag],
  [/sport|active|gym|fitness/i,             Zap],
  [/winter|jacket|coat|down\b|thermal/i,    Snowflake],
  [/dress|skirt|romper|jumpsuit/i,          Sparkles],
  [/shirt|blouse|top\b|tee\b/i,             Shirt],
  [/pant|jean|short\b|legging|bottom/i,     Scissors],
  [/sweater|knit/i,                         Wind],
  [/watch|jewelry|jewel|ring|necklace/i,    Watch],
  [/electronic|gadget|device|tech/i,        Cpu],
  [/home|garden|furniture|kitchen/i,        Sofa],
];

function getCategoryIcon(name: string): LucideIcon {
  for (const [re, icon] of ICON_RULES) {
    if (re.test(name)) return icon;
  }
  return ShoppingBag;
}

// ── Subcategory icon (smaller hint) ──────────────────────────────────────────

const SUB_ICON_RULES: [RegExp, LucideIcon][] = [
  [/zip|zipper|cardigan/i,    Scissors],
  [/pullover|crewneck/i,      Shirt],
  [/oversized|loose/i,        Wind],
  [/graphic|print|design/i,   Sparkles],
  [/sport|active/i,           Zap],
  [/kids|children|boys|girls/i, Baby],
  [/suit|set\b/i,             Layers],
  [/vest|sleeveless/i,        Shirt],
];

function getSubIcon(name: string): LucideIcon {
  for (const [re, icon] of SUB_ICON_RULES) {
    if (re.test(name)) return icon;
  }
  return Tag;
}

// ─────────────────────────────────────────────────────────────────────────────

const MAX_CATS = 8;

export function CategoryBar() {
  const { products } = useStore();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  /* ── Build category tree — top MAX_CATS by product count ────── */
  const dynamicTree = useMemo(() => {
    const catMap = new Map<string, Set<string>>();
    products.forEach((p) => {
      if (!p.category) return;
      if (!catMap.has(p.category)) catMap.set(p.category, new Set());
      if (p.subcategory) catMap.get(p.category)!.add(p.subcategory);
    });
    return Array.from(catMap.entries())
      .map(([name, subs]) => ({
        name,
        count: products.filter((p) => p.category === name).length,
        subcategories: Array.from(subs).sort(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CATS);
  }, [products]);

  /* ── Hover helpers ───────────────────────────────────────────── */
  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 180);
  };
  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  /* ── Navigation helpers ──────────────────────────────────────── */
  const goToCategory = (category: string) => {
    setOpenCategory(null);
    navigate(`/?category=${encodeURIComponent(category)}`, { preventScrollReset: true });
  };

  const goToSubcategory = (category: string, subcategory: string) => {
    setOpenCategory(null);
    navigate(
      `/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`,
      { preventScrollReset: true },
    );
  };

  const openCat = dynamicTree.find((c) => c.name === openCategory);

  if (dynamicTree.length === 0) return null;

  return (
    <nav className="relative z-30 bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch w-full">

          {dynamicTree.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const isActive = activeCategory === cat.name;
            const isOpen   = openCategory  === cat.name;

            return (
              <div
                key={cat.name}
                onMouseEnter={() => { cancelClose(); setOpenCategory(cat.name); }}
                onMouseLeave={scheduleClose}
                className="relative flex-1"
              >
                <button
                  onClick={() => goToCategory(cat.name)}
                  className={`
                    w-full flex items-center justify-center gap-2 px-2 py-3.5 text-sm whitespace-nowrap
                    transition-colors border-b-2 h-full
                    ${isActive || isOpen
                      ? "border-gray-800 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors
                      ${isActive || isOpen ? "text-gray-800" : "text-gray-400"}`}
                    strokeWidth={1.5}
                  />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] ml-0.5 transition-colors
                      ${isActive ? "text-gray-500" : "text-gray-300"}`}
                  >
                    {cat.count}
                  </span>
                </button>
              </div>
            );
          })}

        </div>
      </div>

      {/* ── Megamenu ─────────────────────────────────────────────── */}
      {openCat && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 right-0 bg-white border-b border-gray-100 shadow-xl z-40"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-8">

              {/* ── Left panel: category info ── */}
              <div className="w-52 flex-shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const CatIcon = getCategoryIcon(openCat.name);
                      return <CatIcon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 leading-snug truncate">{openCat.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{openCat.count} productos</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <button
                  onClick={() => goToCategory(openCat.name)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors px-4 py-2 rounded-lg self-start"
                >
                  Ver todos
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>

                {openCat.subcategories.length > 0 && (
                  <p className="text-[10px] tracking-widest uppercase text-gray-400 mt-1">
                    {openCat.subcategories.length} subcategorías
                  </p>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="w-px bg-gray-100 flex-shrink-0" />

              {/* ── Right panel: subcategory grid ── */}
              {openCat.subcategories.length > 0 ? (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-1.5 content-start">
                  {openCat.subcategories.map((sub) => {
                    const SubIcon = getSubIcon(sub);
                    const count = products.filter(
                      (p) => p.category === openCat.name && p.subcategory === sub,
                    ).length;
                    return (
                      <button
                        key={sub}
                        onClick={() => goToSubcategory(openCat.name, sub)}
                        className="flex items-center gap-2 text-left py-2 px-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                          strokeWidth={1.5}
                        />
                        <span className="truncate flex-1 text-xs">{sub}</span>
                        {count > 0 && (
                          <span className="text-[10px] text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center">
                  <p className="text-sm text-gray-400">
                    Explora todos los productos en {openCat.name}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}