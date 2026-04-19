import { useNavigate } from "react-router";
import { useBrands } from "../hooks/useBrands";
import { useLanguage } from "../context/LanguageContext";
import { urls } from "../lib/urls";

export function BrandStrip() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { brands, loading, error } = useBrands();

  const brandList = Array.isArray(brands) ? brands : [];
  const activeBrands = brandList.filter(b => b?.status === "ACTIVE").slice(0, 18);

  if (error) return null;

  if (loading) {
    return (
      <section className="bg-white py-6 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 w-24 bg-gray-50 rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeBrands.length === 0) return null;

  return (
    <section className="bg-white py-6 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm sm:text-base tracking-tight text-gray-900">
            {t("home.topBrands")}
          </h2>
          <button
            type="button"
            onClick={() => navigate(urls.store())}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            {t("home.viewAll")}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {activeBrands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => navigate(`${urls.store()}?brand=${encodeURIComponent(brand.name)}`)}
              className="group flex-shrink-0 flex items-center justify-center w-24 h-12 bg-white border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all px-2"
              title={brand.name}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-7 max-w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-xs text-gray-500 group-hover:text-gray-900 tracking-tight truncate">
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
