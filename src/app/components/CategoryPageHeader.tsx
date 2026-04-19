import { Link } from "react-router";
import { ChevronRight, TrendingUp, Truck, RefreshCw } from "lucide-react";
import { urls } from "../lib/urls";

interface CategoryPageHeaderProps {
  category: string;
  subcategory?: string;
  total: number;
}

/**
 * Hero-style banner for the catalog pages (category / subcategory listings).
 * Replaces the stark "Title + X products" line with a richer block:
 *   - breadcrumb
 *   - large title
 *   - live product count + trust trio (shipping / returns / support)
 *   - soft gradient background tinted by category-name hash
 */

function colorFromName(name: string): string {
  const palettes = [
    "from-blue-50 via-white to-indigo-50",
    "from-amber-50 via-white to-orange-50",
    "from-emerald-50 via-white to-teal-50",
    "from-rose-50 via-white to-pink-50",
    "from-violet-50 via-white to-purple-50",
    "from-sky-50 via-white to-cyan-50",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

export function CategoryPageHeader({ category, subcategory, total }: CategoryPageHeaderProps) {
  const title = subcategory || category;
  const gradient = colorFromName(title);

  return (
    <section className={`bg-gradient-to-r ${gradient} border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 flex-wrap">
          <Link to="/" className="hover:text-blue-700 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
          <Link to={urls.category(category)} className="hover:text-blue-700 transition-colors">
            {category}
          </Link>
          {subcategory && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
              <span className="text-gray-700">{subcategory}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl text-gray-900 tracking-tight leading-tight mb-2">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-gray-900 font-medium">{total}</span>
                productos disponibles
              </span>
              {subcategory && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{category}</span>
                </>
              )}
            </div>
          </div>

          {/* Trust trio — visible on desktop */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-8 h-8 rounded-full bg-white/70 border border-white flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              </div>
              <div className="leading-tight">
                <p className="text-gray-900">Envío rápido</p>
                <p className="text-[10px] text-gray-500">En pedidos +$100</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-8 h-8 rounded-full bg-white/70 border border-white flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              </div>
              <div className="leading-tight">
                <p className="text-gray-900">Devolución fácil</p>
                <p className="text-[10px] text-gray-500">30 días sin coste</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
