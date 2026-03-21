import { useState, useRef, useMemo, useEffect } from "react";
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
  X,
  type LucideIcon,
} from "lucide-react";
import { useNexaFeaturedCategories } from "../services/useNexaFeaturedCategories";
import type { NexaCategory } from "../repositories/NexaCategoryRepository";

// ── Icon resolver by category name ───────────────────────────────────────────

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

const SUB_ICON_RULES: [RegExp, LucideIcon][] = [
  [/zip|zipper|cardigan/i, Scissors],
  [/pullover|crewneck/i, Shirt],
  [/oversized|loose/i, Wind],
  [/graphic|print|design/i, Sparkles],
  [/sport|active/i, Zap],
  [/kids|children|boys|girls/i, Baby],
  [/suit|set\b/i, Layers],
  [/vest|sleeveless/i, Shirt],
];

function getSubIcon(name: string): LucideIcon {
  for (const [re, icon] of SUB_ICON_RULES) {
    if (re.test(name)) return icon;
  }
  return Tag;
}

// ─────────────────────────────────────────────────────────────────────────────

export function CategoryBar() {
  const { categories, loading } = useNexaFeaturedCategories();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  /* ── Build display tree from API categories ─────────────────── */
  const dynamicTree = useMemo(() => {
    return categories.map((cat: NexaCategory) => ({
      id: cat.id,
      name: cat.name,
      count: cat.subCategories.length,
      subcategories: cat.subCategories
        .map((sc) => ({ id: sc.id, name: sc.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [categories]);

  /* ── Close mobile panel on scroll ───────────────────────────── */
  useEffect(() => {
    const onScroll = () => setMobileOpen(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Lock body scroll when mobile panel is open ─────────────── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* ── Desktop hover helpers ───────────────────────────────────── */
  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 180);
  };
  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  /* ── Navigation helpers ──────────────────────────────────────── */
  const goToCategory = (category: string, _categoryId?: string) => {
    setOpenCategory(null);
    setMobileOpen(null);
    const params = new URLSearchParams();
    params.set("category", category);
    // L1 categories only expand the sidebar — no API call
    navigate(`/?${params.toString()}`, { preventScrollReset: true });
  };

  const goToSubcategory = (
    category: string,
    subcategory: string,
    parentCategoryId?: string,
    subcategoryId?: string,
  ) => {
    setOpenCategory(null);
    setMobileOpen(null);
    const params = new URLSearchParams();
    params.set("category", category);
    if (parentCategoryId) params.set("categoryId", parentCategoryId);
    params.set("subcategory", subcategory);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    navigate(`/?${params.toString()}`, { preventScrollReset: true });
  };

  /* ── Mobile tap handler ──────────────────────────────────────── */
  const handleMobileTap = (cat: (typeof dynamicTree)[0]) => {
    if (cat.subcategories.length === 0) {
      goToCategory(cat.name, cat.id);
    } else {
      setMobileOpen((prev) => (prev === cat.name ? null : cat.name));
    }
  };

  const openCat = dynamicTree.find((c) => c.name === openCategory);
  const mobileOpenCat = dynamicTree.find((c) => c.name === mobileOpen);

  if (loading || dynamicTree.length === 0) return null;

  return (
    <>
      <nav className="relative z-30 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-0 sm:px-6 lg:px-8">
          <div className="flex items-stretch w-full">

            {dynamicTree.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = activeCategory === cat.name;
              const isOpen = openCategory === cat.name;
              const isMobOpen = mobileOpen === cat.name;

              return (
                <div
                  key={cat.name}
                  /* desktop hover */
                  onMouseEnter={() => { if (window.innerWidth >= 640) { cancelClose(); setOpenCategory(cat.name); } }}
                  onMouseLeave={() => { if (window.innerWidth >= 640) scheduleClose(); }}
                  className="relative flex-1"
                >
                  <button
                    /* mobile tap vs desktop click */
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        handleMobileTap(cat);
                      } else {
                        goToCategory(cat.name, cat.id);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-center gap-2 px-1 sm:px-2 py-3.5 text-sm whitespace-nowrap
                      transition-colors border-b-2 h-full
                      ${isActive || isOpen || isMobOpen
                        ? "border-gray-800 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0 transition-colors
                        ${isActive || isOpen || isMobOpen ? "text-gray-800" : "text-gray-400"}`}
                      strokeWidth={1.5}
                    />
                    <span className="hidden sm:inline">{cat.name}</span>
                    <span
                      className={`hidden sm:inline text-[10px] ml-0.5 transition-colors
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

        {/* ── Desktop megamenu ─────────────────────────────────── */}
        {openCat && (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="hidden sm:block absolute left-0 right-0 bg-white border-b border-gray-100 shadow-xl z-40"
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex gap-8">

                {/* Left panel */}
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
                      <p className="text-[11px] text-gray-400 mt-0.5">{openCat.count} subcategorías</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <button
                    onClick={() => goToCategory(openCat.name, openCat.id)}
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

                {/* Divider */}
                <div className="w-px bg-gray-100 flex-shrink-0" />

                {/* Right panel */}
                {openCat.subcategories.length > 0 ? (
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-1.5 content-start">
                    {openCat.subcategories.map((sub) => {
                      const SubIcon = getSubIcon(sub.name);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => goToSubcategory(openCat.name, sub.name, openCat.id, sub.id)}
                          className="flex items-center gap-2 text-left py-2 px-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
                        >
                          <SubIcon
                            className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                            strokeWidth={1.5}
                          />
                          <span className="truncate flex-1 text-xs">{sub.name}</span>
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

      {/* ── Mobile bottom sheet ───────────────────────────────────── */}
      {mobileOpenCat && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(null)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">

            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const CatIcon = getCategoryIcon(mobileOpenCat.name);
                    return <CatIcon className="w-4.5 h-4.5 text-gray-600" strokeWidth={1.5} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm text-gray-900">{mobileOpenCat.name}</p>
                  <p className="text-[11px] text-gray-400">{mobileOpenCat.count} subcategorías</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* "Ver todos" CTA */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <button
                onClick={() => goToCategory(mobileOpenCat.name, mobileOpenCat.id)}
                className="w-full flex items-center justify-center gap-2 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 active:bg-gray-300 transition-colors px-4 py-2.5 rounded-xl"
              >
                Ver todos en {mobileOpenCat.name}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Subcategories grid — scrollable */}
            {mobileOpenCat.subcategories.length > 0 ? (
              <div className="overflow-y-auto px-4 pb-6 pt-1">
                <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">
                  {mobileOpenCat.subcategories.length} subcategorías
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mobileOpenCat.subcategories.map((sub) => {
                    const SubIcon = getSubIcon(sub.name);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => goToSubcategory(mobileOpenCat.name, sub.name, mobileOpenCat.id, sub.id)}
                        className="flex items-center gap-2 text-left py-2.5 px-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors group"
                      >
                        <SubIcon
                          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                          strokeWidth={1.5}
                        />
                        <span className="truncate flex-1 text-xs text-gray-700">{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-6 pt-2">
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay subcategorías disponibles
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
