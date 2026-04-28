import { useMemo } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { useNexaCategories } from "../hooks/useNexaCategories";
import { useCategoryTopProducts } from "../hooks/useCategoryTopProducts";
import { useLanguage } from "../context/LanguageContext";
import { urls } from "../lib/urls";
import type { NexaCategory } from "../repositories/NexaCategoryRepository";

interface SiblingCategoriesRowProps {
  currentCategoryId?: string;
  currentSubcategoryId?: string;
}

/**
 * Lateral navigation row: when the user lands on a subcategory page (e.g.
 * "Crossbody Bags") we show scrollable chips with the other subcategories
 * under the same parent ("Backpacks", "Handbags", "Wallets", …) plus a
 * tiny cover image pulled from each sibling's first product. Lets the
 * visitor jump sideways without going back to the mega menu.
 */
export function SiblingCategoriesRow({
  currentCategoryId,
  currentSubcategoryId,
}: SiblingCategoriesRowProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { categories } = useNexaCategories();

  // Locate the parent whose subtree contains the active (sub)category and
  // surface its direct children as siblings.
  const { parent, siblings } = useMemo(() => {
    const findParent = (nodes: NexaCategory[]): NexaCategory | null => {
      for (const c of nodes) {
        if (
          c.subCategories?.some(
            (sc) =>
              sc.id === (currentSubcategoryId ?? currentCategoryId) ||
              sc.subCategories?.some((sub) => sub.id === (currentSubcategoryId ?? currentCategoryId)),
          )
        ) {
          return c;
        }
      }
      return null;
    };
    const found = findParent(categories);
    if (!found) return { parent: null, siblings: [] as NexaCategory[] };
    return {
      parent: found,
      siblings: (found.subCategories ?? []).filter((s) => s.active),
    };
  }, [categories, currentCategoryId, currentSubcategoryId]);

  const siblingIds = useMemo(() => siblings.map((s) => s.id), [siblings]);
  const { map: productsByCat } = useCategoryTopProducts(siblingIds, 1);

  if (!parent || siblings.length <= 1) return null;

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm text-gray-900 tracking-tight">
            {t("category.exploreParent").replace("{name}", parent.name)}
          </h2>
          <button
            type="button"
            onClick={() => navigate(urls.category(parent.name))}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-0.5"
          >
            {t("category.viewAll")}
            <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {siblings.map((sib) => {
            const isActive =
              sib.id === currentSubcategoryId ||
              (!currentSubcategoryId && sib.id === currentCategoryId);
            const cover = productsByCat[sib.id]?.[0]?.image;
            return (
              <button
                key={sib.id}
                type="button"
                onClick={() =>
                  navigate(
                    `${urls.subcategory(parent.name, sib.name)}?subcategoryId=${sib.id}`,
                  )
                }
                className={`group flex-shrink-0 flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all ${isActive
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
              >
                <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/10" : "bg-gray-50"}`}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={sib.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}
                </div>
                <span className="text-xs whitespace-nowrap">{sib.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
