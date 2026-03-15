import { useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Tag, Layers } from "lucide-react";
import { useStore } from "../context/StoreContext";

export function CategoryBar() {
  const { products } = useStore();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  /* ── Build dynamic category tree from loaded products ─────── */
  const dynamicTree = useMemo(() => {
    const catMap = new Map<string, Set<string>>();
    products.forEach((p) => {
      if (!p.category) return;
      if (!catMap.has(p.category)) catMap.set(p.category, new Set());
      if (p.subcategory) catMap.get(p.category)!.add(p.subcategory);
    });
    return Array.from(catMap.entries()).map(([name, subs]) => ({
      name,
      subcategories: Array.from(subs).sort(),
    }));
  }, [products]);

  function getSubcategoryCount(subcategory: string) {
    return products.filter((p) => p.subcategory === subcategory).length;
  }

  /* ── hover helpers ──────────────────────────────────────────── */
  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 160);
  };
  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };
  const handleMouseEnter = (name: string) => {
    cancelClose();
    setOpenCategory(name);
  };

  /* ── navigation helpers ─────────────────────────────────────── */
  const scrollToProducts = () =>
    setTimeout(() => {
      document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

  const goToCategory = (category: string) => {
    setOpenCategory(null);
    navigate(`/?category=${encodeURIComponent(category)}`);
    scrollToProducts();
  };

  const goToSubcategory = (category: string, subcategory: string) => {
    setOpenCategory(null);
    navigate(`/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    scrollToProducts();
  };

  const openCat = dynamicTree.find((c) => c.name === openCategory);

  if (dynamicTree.length === 0) return null;

  return (
    <nav className="relative z-30 bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">

          {dynamicTree.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <div
                key={cat.name}
                onMouseEnter={() => handleMouseEnter(cat.name)}
                onMouseLeave={scheduleClose}
                className="relative flex-shrink-0"
              >
                <button
                  onClick={() => goToCategory(cat.name)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? "border-gray-800 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                  {cat.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mega-dropdown ── */}
      {openCat && openCat.subcategories.length > 0 && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-40"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-8">
              {/* Category info */}
              <div className="w-48 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  <span className="text-sm text-gray-900">{openCat.name}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {products.filter((p) => p.category === openCat.name).length} productos
                </p>
                <button
                  onClick={() => goToCategory(openCat.name)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Ver todos
                  <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>

              {/* Subcategories grid */}
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-2">
                {openCat.subcategories.map((sub) => {
                  const count = getSubcategoryCount(sub);
                  return (
                    <button
                      key={sub}
                      onClick={() => goToSubcategory(openCat.name, sub)}
                      className="flex items-center justify-between text-left text-sm text-gray-600 hover:text-gray-900 py-1 transition-colors group"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors flex-shrink-0" />
                        <span className="truncate">{sub}</span>
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}