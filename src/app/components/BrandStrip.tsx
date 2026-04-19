import { useNavigate } from "react-router";
import { useBrands } from "../hooks/useBrands";
import { useLanguage } from "../context/LanguageContext";
import { urls } from "../lib/urls";

export function BrandStrip() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { brands, loading } = useBrands();

  const activeBrands = brands.filter(b => b.status === "ACTIVE").slice(0, 14);

  if (loading) {
    return (
      <section className="bg-gray-50 py-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 w-32 bg-white rounded-xl animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeBrands.length === 0) return null;

  return (
    <section className="bg-gray-50 py-8 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base sm:text-lg tracking-tight text-gray-900">
            {t("home.topBrands") || "Marcas destacadas"}
          </h2>
          <span className="text-xs text-gray-400">{activeBrands.length} marcas</span>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {activeBrands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => navigate(`${urls.store()}?brand=${encodeURIComponent(brand.name)}`)}
              className="group flex-shrink-0 flex items-center justify-center w-36 h-20 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all px-4"
              title={brand.name}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-10 max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-sm text-gray-600 group-hover:text-gray-900 tracking-tight">
                  {brand.name}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
