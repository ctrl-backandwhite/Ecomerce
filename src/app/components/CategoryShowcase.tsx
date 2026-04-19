import { useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ArrowRight } from "lucide-react";
import { useNexaCategories } from "../hooks/useNexaCategories";
import { useCategoryTopProducts } from "../hooks/useCategoryTopProducts";
import { urls } from "../lib/urls";

const MAX_TILES = 8;
const THUMBS_PER_TILE = 4;

const TILE_BGS = [
  "from-blue-50 to-indigo-100",
  "from-amber-50 to-orange-100",
  "from-emerald-50 to-teal-100",
  "from-rose-50 to-pink-100",
  "from-violet-50 to-purple-100",
  "from-sky-50 to-cyan-100",
  "from-lime-50 to-green-100",
  "from-fuchsia-50 to-rose-100",
];

/**
 * Amazon-style category tiles. Each tile fetches its own top products so
 * thumbnails reflect the real catalogue of that category (not just what's
 * on the first global page). Empty slots in the 2x2 grid show a soft
 * gradient placeholder so the layout is always complete.
 */
export function CategoryShowcase() {
  const { categories, loading: catsLoading } = useNexaCategories();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * "Ver todo" = bring the user to the full product grid section of this
   * same page. When already on /store we just scroll; otherwise we route
   * there and let the landing page render with the grid in view.
   */
  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("productos");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(urls.store() + "#productos");
    }
    if (!location.pathname.startsWith("/store") && location.pathname !== "/") {
      navigate(urls.store() + "#productos");
    }
  };

  // Use featured categories first, then fall back to all for the next slots
  const tileCategories = useMemo(() => {
    const featured = categories.filter((c) => c.featured);
    const rest = categories.filter((c) => !c.featured);
    return [...featured, ...rest].filter((c) => c.active).slice(0, MAX_TILES);
  }, [categories]);

  const tileIds = useMemo(() => tileCategories.map((c) => c.id), [tileCategories]);
  const { map: productsByCat, loading: productsLoading } = useCategoryTopProducts(tileIds, THUMBS_PER_TILE);

  // Only keep tiles that actually have at least one product — no empty cards.
  const tiles = useMemo(() => {
    if (productsLoading) return [];
    return tileCategories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        products: productsByCat[cat.id] ?? [],
      }))
      .filter((t) => t.products.length > 0);
  }, [tileCategories, productsByCat, productsLoading]);

  if (catsLoading || productsLoading) {
    return (
      <section className="py-10 bg-gray-50 border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 w-[300px] flex-shrink-0 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tiles.length === 0) return null;

  return (
    <section className="py-10 bg-gray-50 border-b border-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl sm:text-2xl text-gray-900 tracking-tight">
            Explora nuestras categorías
          </h2>
          <button
            type="button"
            onClick={handleViewAll}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            Ver todo
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Full-bleed horizontal strip */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 px-4 sm:px-6 lg:px-8 pb-2">
          {tiles.map((tile, tileIdx) => {
            const gradient = TILE_BGS[tileIdx % TILE_BGS.length];
            return (
              <Link
                key={tile.id}
                to={urls.category(tile.name)}
                className="group bg-white rounded-2xl p-5 flex flex-col w-[280px] sm:w-[300px] flex-shrink-0 hover:shadow-lg transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-base text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors line-clamp-1">
                    {tile.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                    {tile.products.length}+ items
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Array.from({ length: THUMBS_PER_TILE }).map((_, i) => {
                    const thumb = tile.products[i];
                    if (thumb) {
                      return (
                        <div
                          key={i}
                          className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                        >
                          <img
                            src={thumb.image}
                            alt={thumb.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center opacity-70`}
                      />
                    );
                  })}
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-gray-900 transition-colors mt-auto">
                  Descubre {tile.name}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
