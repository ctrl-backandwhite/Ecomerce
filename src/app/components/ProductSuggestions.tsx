import { Sparkles } from "lucide-react";
import { useProductSuggestions } from "../hooks/useProductSuggestions";
import { MiniProductCard } from "./MiniProductCard";
import { useLanguage } from "../context/LanguageContext";

interface ProductSuggestionsProps {
  /** How many products to surface. Defaults to 12. */
  limit?: number;
}

/**
 * "Sugerido para ti" — horizontal rail that mirrors the look of the
 * "Explora nuestras categorías" showcase but with compact product cards.
 * Stays silent on first visits so new users don't see an empty rail with
 * a promising title.
 */
export function ProductSuggestions({ limit = 12 }: ProductSuggestionsProps) {
  const { suggestions, loading, basedOn } = useProductSuggestions(limit);
  const { t } = useLanguage();

  if (!loading && suggestions.length === 0) return null;

  const subtitle = basedOn.length > 0
    ? `${t("suggestions.basedOn") || "Basado en tu interés en"} ${basedOn.join(" · ")}`
    : undefined;

  return (
    <section className="py-10 bg-gray-50 border-b border-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="text-xl sm:text-2xl text-gray-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          {t("suggestions.title") || "Sugerido para ti"}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[160px] sm:w-[180px] flex-shrink-0">
                <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                <div className="mt-2 h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="mt-1 h-3 bg-gray-200 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="flex gap-4 px-4 sm:px-6 lg:px-8 pb-2">
            {suggestions.map((p) => (
              <MiniProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
