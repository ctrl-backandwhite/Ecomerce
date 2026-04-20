import { Sparkles } from "lucide-react";
import { useProductSuggestions } from "../hooks/useProductSuggestions";
import { ProductCard } from "./ProductCard";
import { useLanguage } from "../context/LanguageContext";

interface ProductSuggestionsProps {
  /** How many products to surface. Defaults to 10. */
  limit?: number;
  /** Compact layout renders a horizontal scroll strip (product detail). The
   *  default is a responsive grid (home page). */
  variant?: "grid" | "strip";
}

/**
 * "Sugerido para ti" block, rendered only when we have enough signal from
 * the user's recent visits to produce recommendations. Hidden on first
 * visits so new users don't see an empty card with a mysterious title.
 */
export function ProductSuggestions({ limit = 10, variant = "grid" }: ProductSuggestionsProps) {
  const { suggestions, loading, basedOn } = useProductSuggestions(limit);
  const { t } = useLanguage();

  if (!loading && suggestions.length === 0) return null;

  const subtitle = basedOn.length > 0
    ? `${t("suggestions.basedOn") || "Basado en tu interés en"} ${basedOn.join(" · ")}`
    : undefined;

  return (
    <section className="py-10 bg-white border-t border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              {t("suggestions.title") || "Sugerido para ti"}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {loading && suggestions.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3.5 space-y-2">
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                  <div className="h-2 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : variant === "strip" ? (
          <div className="w-full overflow-x-auto scrollbar-thin">
            <div className="flex gap-4 pb-2">
              {suggestions.map((p) => (
                <div key={p.id} className="w-[220px] sm:w-[240px] flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
