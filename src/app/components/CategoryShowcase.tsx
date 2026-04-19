import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useNexaCategories } from "../hooks/useNexaCategories";
import { useNexaProducts } from "../hooks/useNexaProducts";
import { urls } from "../lib/urls";

/**
 * Amazon-style category showcase tiles. Each tile shows the category name
 * plus a 2x2 grid of product thumbnails pulled from the current catalogue.
 * Categories with zero products in scope are skipped so we never render an
 * empty tile.
 */
export function CategoryShowcase() {
  const { categories, loading: catsLoading } = useNexaCategories();
  const { products, loading: productsLoading } = useNexaProducts();

  const tiles = useMemo(() => {
    return categories
      .map((cat) => {
        const inCat = products.filter((p) => p.category === cat.name);
        return {
          id: cat.id,
          name: cat.name,
          thumbs: inCat.slice(0, 4).map((p) => ({ src: p.image, alt: p.name })),
          count: inCat.length,
        };
      })
      .filter((t) => t.thumbs.length >= 2)
      .slice(0, 8);
  }, [categories, products]);

  if (catsLoading || productsLoading) {
    return (
      <section className="py-10 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tiles.length === 0) return null;

  return (
    <section className="py-10 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl sm:text-2xl text-gray-900 tracking-tight">
            Explora nuestras categorías
          </h2>
          <Link
            to={urls.store()}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            Ver todo
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              to={urls.category(tile.name)}
              className="group bg-white rounded-2xl p-5 flex flex-col hover:shadow-lg transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-base text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors line-clamp-1">
                  {tile.name}
                </h3>
                <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                  {tile.count}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {Array.from({ length: 4 }).map((_, i) => {
                  const thumb = tile.thumbs[i];
                  return (
                    <div
                      key={i}
                      className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                    >
                      {thumb ? (
                        <img
                          src={thumb.src}
                          alt={thumb.alt}
                          loading="lazy"
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-gray-900 transition-colors mt-auto">
                Descubre {tile.name}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
