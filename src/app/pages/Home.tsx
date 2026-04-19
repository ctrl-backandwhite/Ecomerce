import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router";
import {
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
import { CategoryShowcase } from "../components/CategoryShowcase";
import { CategoryPageHeader } from "../components/CategoryPageHeader";
import { SiblingCategoriesRow } from "../components/SiblingCategoriesRow";
import { DualPromoBanner } from "../components/DualPromoBanner";
import { HomeSidebar } from "../components/HomeSidebar";
import { MobileFilterDrawer } from "../components/MobileFilterDrawer";
import { usePriceRanges } from "../hooks/usePriceRanges";
import { useFlashDeals } from "../hooks/useFlashDeals";
import { ATTR_MATCH, CATEGORY_ATTR_FILTERS } from "../config/filters";
import { useNexaProducts } from "../hooks/useNexaProducts";
import { useNexaCategories } from "../hooks/useNexaCategories";
import { useLanguage } from "../context/LanguageContext";
import { slugify, urls } from "../lib/urls";
import { useProductSearch } from "../hooks/useProductSearch";
import { mapSearchHitToProduct } from "../mappers/NexaProductMapper";

const PAGE_SIZE = 24;

function scrollToProducts() {
  const el = document.getElementById("productos");
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

export function Home() {
  const { t } = useLanguage();
  const priceRanges = usePriceRanges();

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
    // 1. Direct top-level match
    const topLevel = categories.find((c) => slugify(c.name) === catSlug);
    if (topLevel) return topLevel;
    // 2. Featured subcategory navigation (e.g. /store/outerwear-jackets):
    //    the CategoryBar may link to a level-2 featured category using a flat
    //    slug.  Find the parent that contains this subcategory — prefer
    //    featured matches in case of name collisions across parents.
    let bestParent: typeof categories[0] | null = null;
    for (const cat of categories) {
      const match = cat.subCategories.find((sc) => slugify(sc.name) === catSlug);
      if (match) {
        if (match.featured) return cat;   // featured → immediate match
        if (!bestParent) bestParent = cat; // keep first non-featured as fallback
      }
    }
    return bestParent;
  }, [catSlug, categories]);

  const resolvedSubcategory = useMemo(() => {
    if (!resolvedCategory) return null;
    // Helper: search level-2 and level-3 children
    const findInTree = (slug: string) => {
      for (const s of resolvedCategory.subCategories) {
        if (slugify(s.name) === slug) return s;
        for (const ch of (s.subCategories ?? [])) {
          if (slugify(ch.name) === slug) return ch;
        }
      }
      return null;
    };
    // Normal two-segment route: /store/:catSlug/:subcatSlug
    if (subcatSlug) {
      return findInTree(subcatSlug);
    }
    // Single-segment route where catSlug matched a *subcategory* (featured nav)
    if (catSlug && slugify(resolvedCategory.name) !== catSlug) {
      return findInTree(catSlug);
    }
    return null;
  }, [catSlug, subcatSlug, resolvedCategory]);

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

  /* ── Variant attribute filters (dynamic, URL-driven) ──────────
   * Serialized as `v=color:Red,size:M`. Each entry is attr:value. */
  const variantValues = useMemo<Record<string, string>>(() => {
    const raw = searchParams.get("v") ?? "";
    if (!raw) return {};
    const out: Record<string, string> = {};
    raw.split(",").forEach((pair) => {
      const [k, ...rest] = pair.split(":");
      const v = rest.join(":").trim();
      if (k && v) out[k.trim()] = v;
    });
    return out;
  }, [searchParams]);

  /* Keyword facets selected from the sidebar (CSV in `kw` param) */
  const selectedKeywords = useMemo<string[]>(() => {
    const raw = searchParams.get("kw") ?? "";
    return raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : [];
  }, [searchParams]);

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

  const isSearching = searchQuery.trim().length >= 2;
  const {
    results: esResults,
    totalHits: esTotalHits,
    loading: esLoading,
    hasMore: esHasMore,
    loadMore: esLoadMore,
  } = useProductSearch(searchQuery);

  const [selectedPriceIdx, setSelectedPriceIdx] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(0);
  const [promoClickKey, setPromoClickKey] = useState(0);

  /* ── Flash deals (all campaign products) ── */
  const { allDeals: campaignDeals } = useFlashDeals();
  const campaignDealIds = useMemo(
    () => new Set(campaignDeals.map((d) => d.id)),
    [campaignDeals],
  );

  /* ── Infinite-scroll refs (callback-ref pattern) ─────────────── */
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef(apiLoadMore);
  useEffect(() => { loadMoreRef.current = isSearching ? esLoadMore : apiLoadMore; });

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

    if (soloOfertas) {
      if (campaignDealIds.size > 0) {
        // Show only products that match the active campaign
        list = list.filter((p) => campaignDealIds.has(p.id));
        // Apply campaign prices from allDeals
        const priceMap = new Map(campaignDeals.map((d) => [d.id, d]));
        list = list.map((p) => {
          const deal = priceMap.get(p.id);
          if (deal) return { ...p, price: deal.price, originalPrice: deal.originalPrice };
          return p;
        });
      } else {
        list = list.filter((p) => p.originalPrice !== undefined);
      }
    }

    // Skip client-side subcategory filter when API already filtered by subcategoryId
    if (selectedSubcat && !selectedSubcategoryId)
      list = list.filter((p) => p.subcategory === selectedSubcat);

    if (selectedBrand)
      list = list.filter((p) => p.brand === selectedBrand);

    if (selectedAttr) {
      const matchFn = ATTR_MATCH[selectedCategory]?.[selectedAttr];
      if (matchFn) list = list.filter(matchFn);
    }

    // Dynamic variant-attribute filter: product passes if at least one of
    // its variants matches every selected (attr -> value) pair.
    const variantEntries = Object.entries(variantValues);
    if (variantEntries.length > 0) {
      list = list.filter((p) =>
        (p.variants ?? []).some((v) =>
          variantEntries.every(([k, val]) => v.attributes?.[k] === val)
        )
      );
    }

    // Keyword facets: every selected keyword must appear in product name.
    if (selectedKeywords.length > 0) {
      list = list.filter((p) => {
        const hay = p.name.toLowerCase();
        return selectedKeywords.every((kw) => hay.includes(kw));
      });
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
    selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas, products,
    campaignDealIds, campaignDeals, variantValues, selectedKeywords, selectedSubcategoryId]);

  /* ── Reset filterKey when local filters change ─────────────── */
  useEffect(() => {
    setFilterKey((k) => k + 1);
  }, [selectedCategory, selectedSubcat, selectedBrand, selectedAttr,
    selectedPriceIdx, selectedRating, sortBy, searchQuery, soloOfertas, variantValues, selectedKeywords]);

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
      const qs = params.ofertas ? `?ofertas=${params.ofertas}` : "";
      navigate(`${dest}${qs}`, { preventScrollReset: true });
    } else if (params.ofertas) {
      navigate(`${urls.store()}?ofertas=${params.ofertas}`, { preventScrollReset: true });
    }
  }, [navigate]);

  /* ── Filter handlers ─────────────────────────────────────────── */
  const handleCategory = (cat: string, catId?: string) => {
    if (cat === "Todos") {
      navigate(urls.store(), { preventScrollReset: true });
    } else {
      const dest = urls.category(cat);
      navigate(catId ? `${dest}?categoryId=${catId}` : dest, { preventScrollReset: true });
    }
  };

  const handleSubcategory = (cat: string, sub: string, catId?: string, subId?: string) => {
    if (sub === selectedSubcat) {
      // Toggle off — go back to parent category
      const dest = urls.category(cat);
      navigate(catId ? `${dest}?categoryId=${catId}` : dest, { preventScrollReset: true });
    } else {
      const dest = urls.subcategory(cat, sub);
      navigate(subId ? `${dest}?subcategoryId=${subId}` : dest, { preventScrollReset: true });
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

  const handleToggleKeyword = (kw: string) => {
    const current = new Set(selectedKeywords);
    if (current.has(kw)) current.delete(kw);
    else current.add(kw);
    const next = new URLSearchParams(searchParams.toString());
    const serialized = [...current].join(",");
    if (serialized) next.set("kw", serialized);
    else next.delete("kw");
    setSearchParams(next, { preventScrollReset: true });
  };

  const handleVariantValue = (attrName: string, value: string) => {
    const draft = { ...variantValues };
    if (!value) delete draft[attrName];
    else draft[attrName] = value;
    const serialized = Object.entries(draft)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    const next = new URLSearchParams(searchParams.toString());
    if (serialized) next.set("v", serialized);
    else next.delete("v");
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
    ...Object.entries(variantValues).map(([k, v]) => ({
      label: `${k}: ${v}`,
      clear: () => handleVariantValue(k, ""),
    })),
    ...selectedKeywords.map((kw) => ({
      label: kw,
      clear: () => handleToggleKeyword(kw),
    })),
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const hasFilters = pills.length > 0;

  /* ── Section title ───────────────────────────────────────────── */
  const sectionTitle = (() => {
    if (searchQuery) return `${t("home.searchResults")} "${searchQuery}"`;
    if (soloOfertas && selectedCategory !== "Todos") return `${t("home.dealsFor")} ${selectedCategory}`;
    if (soloOfertas) return t("home.deals");
    if (selectedSubcat) return selectedSubcat;
    if (selectedBrand && selectedCategory !== "Todos") return `${selectedBrand} · ${selectedCategory}`;
    if (selectedBrand) return selectedBrand;
    if (selectedAttr) return selectedAttr;
    if (selectedCategory !== "Todos") return selectedCategory;
    return t("home.allProducts");
  })();

  // Landing view: homepage without category/subcategory filters or a search
  // query. Used to decide which marketing sections to render.
  const isLanding =
    selectedCategory === "Todos" &&
    !selectedSubcat &&
    !searchQuery &&
    !soloOfertas &&
    !selectedBrand;

  return (
    <div className="min-h-screen">

      {/* Category Bar — mega menu (untouched) */}
      <CategoryBar />

      {/* Hero slider — only on the landing; feels wrong on category pages */}
      {isLanding && <PromoSlider onCtaClick={handlePromoCta} />}

      {/* Category hero banner — replaces the slider on category pages */}
      {!isLanding && selectedCategory !== "Todos" && (
        <>
          <CategoryPageHeader
            category={selectedCategory}
            subcategory={selectedSubcat || undefined}
            total={filtered.length}
          />
          <SiblingCategoriesRow
            currentCategoryId={selectedCategoryId}
            currentSubcategoryId={selectedSubcategoryId}
          />
        </>
      )}

      {/* Info Banner */}
      <InfoBanner />

      {/* Landing-only marketing blocks */}
      {isLanding && <CategoryShowcase />}

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

      {/* Dual promo banner (sign-up + newsletter) — landing only */}
      {isLanding && <DualPromoBanner />}

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
                variantValues={variantValues}
                selectedKeywords={selectedKeywords}
                onCategory={handleCategory}
                onBrand={handleBrand}
                onAttr={handleAttr}
                onPrice={setSelectedPriceIdx}
                onRating={setSelectedRating}
                onSort={setSortBy}
                onReset={handleReset}
                onVariantValue={handleVariantValue}
                onToggleKeyword={handleToggleKeyword}
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
                    {t("home.filters")}
                  </button>

                  {/* Title — desktop only */}
                  <div className="hidden lg:block">
                    <h2 className="text-xl tracking-tight text-gray-900">
                      {sectionTitle}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isSearching ? esTotalHits : filtered.length} {t("home.products")}
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
                  <option value="featured">{t("home.featured")}</option>
                  <option value="price-low">{t("home.priceLow")}</option>
                  <option value="price-high">{t("home.priceHigh")}</option>
                  <option value="rating">{t("home.topRated")}</option>
                  <option value="name">{t("home.nameAZ")}</option>
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
                      {t("home.all")}
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
                        {filtered.length} {t("home.results")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Data source badge ── */}
              {dataSource === "api" && (
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-gray-400">{t("home.catalogLive")}</span>
                </div>
              )}
              {dataSource === "mock" && (
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-gray-400">{t("home.demoMode")}</span>
                </div>
              )}

              {/* ── Error state ── */}
              {productsError && !productsLoading && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertTriangle className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-gray-500 mb-1">{t("home.errorLoading")}</p>
                  <p className="text-xs text-gray-400 mb-4 max-w-sm">{productsError}</p>
                  <button
                    onClick={() => refreshProducts()}
                    className="flex items-center gap-1.5 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t("home.retry")}
                  </button>
                </div>
              )}

              {/* ── Initial loading skeleton ── */}
              {((isSearching ? esLoading && esResults.length === 0 : productsLoading && products.length === 0)) && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
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
              {isSearching ? (
                esResults.length > 0 ? (
                  <div key={filterKey} className="nx036-grid-enter">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {esResults.map((hit) => (
                        <ProductCard key={hit.id} product={mapSearchHitToProduct(hit)} />
                      ))}
                    </div>
                    <div ref={sentinelRef} className="mt-12 flex items-center justify-center min-h-[48px]">
                      {esLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("home.loadingMore")}
                        </div>
                      )}
                      {!esHasMore && esResults.length > PAGE_SIZE && (
                        <p className="text-xs text-gray-300 tracking-widest uppercase">
                          {t("home.allLoaded")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : !esLoading ? (
                  <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-lg text-gray-900 mb-2">{t("home.noResults")}</h3>
                    <p className="text-sm text-gray-400 mb-6">{t("home.noResultsHint")}</p>
                    <button
                      onClick={handleReset}
                      className="text-sm px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t("home.clearFilters")}
                    </button>
                  </div>
                ) : null
              ) : (!productsLoading || products.length > 0) ? (
                filtered.length > 0 ? (
                  <div key={filterKey} className="nx036-grid-enter">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filtered.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {/* Sentinel + loader */}
                    <div ref={sentinelRef} className="mt-12 flex items-center justify-center min-h-[48px]">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("home.loadingMore")}
                        </div>
                      )}
                      {!hasMore && filtered.length > PAGE_SIZE && (
                        <p className="text-xs text-gray-300 tracking-widest uppercase">
                          {t("home.allLoaded")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-lg text-gray-900 mb-2">{t("home.noResults")}</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      {t("home.noResultsHint")}
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-sm px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t("home.clearFilters")}
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
              { icon: "🚚", title: t("features.shipping"), sub: t("features.shipping.sub") },
              { icon: "🔒", title: t("features.secure"), sub: t("features.secure.sub") },
              { icon: "💳", title: t("features.payment"), sub: t("features.payment.sub") },
              { icon: "🎧", title: t("features.support"), sub: t("features.support.sub") },
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