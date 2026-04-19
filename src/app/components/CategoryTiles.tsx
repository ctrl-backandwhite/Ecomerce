import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Shirt, Laptop, Home as HomeIcon, Sparkles, Baby, Gamepad2,
  Dumbbell, Book, Car, Watch, Palette, Utensils, Camera, Music, Heart,
  Package,
} from "lucide-react";
import { useNexaCategories } from "../hooks/useNexaCategories";
import { useLanguage } from "../context/LanguageContext";
import { urls } from "../lib/urls";

const CATEGORY_ICON_MAP: Record<string, typeof Shirt> = {
  ropa: Shirt,
  moda: Shirt,
  clothing: Shirt,
  electronica: Laptop,
  electronics: Laptop,
  tecnologia: Laptop,
  hogar: HomeIcon,
  home: HomeIcon,
  belleza: Sparkles,
  beauty: Sparkles,
  bebe: Baby,
  niños: Baby,
  kids: Baby,
  juguetes: Gamepad2,
  toys: Gamepad2,
  gaming: Gamepad2,
  deportes: Dumbbell,
  sports: Dumbbell,
  libros: Book,
  books: Book,
  auto: Car,
  automotriz: Car,
  automotive: Car,
  relojes: Watch,
  accesorios: Watch,
  arte: Palette,
  cocina: Utensils,
  kitchen: Utensils,
  camara: Camera,
  fotografia: Camera,
  musica: Music,
  music: Music,
  salud: Heart,
  health: Heart,
};

const TILE_BG_COLORS = [
  "bg-blue-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-rose-50",
  "bg-violet-50",
  "bg-sky-50",
  "bg-orange-50",
  "bg-teal-50",
];

function iconFor(categoryName: string): typeof Shirt {
  const normalized = categoryName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const key of Object.keys(CATEGORY_ICON_MAP)) {
    if (normalized.includes(key)) return CATEGORY_ICON_MAP[key];
  }
  return Package;
}

export function CategoryTiles() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { categories, loading } = useNexaCategories();

  const topCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.filter(c => c?.active).slice(0, 8);
  }, [categories]);

  if (loading) {
    return (
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (topCategories.length === 0) return null;

  return (
    <section className="bg-white py-8 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-lg sm:text-xl tracking-tight text-gray-900">
            {t("home.shopByCategory") || "Explora por categoría"}
          </h2>
          <button
            type="button"
            onClick={() => navigate(urls.store())}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            {t("home.viewAll") || "Ver todo"}
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {topCategories.map((cat, i) => {
            const Icon = iconFor(cat.name);
            const bg = TILE_BG_COLORS[i % TILE_BG_COLORS.length];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(urls.category(cat.name))}
                className="group flex flex-col items-center gap-2 focus:outline-none"
              >
                <div className={`w-full aspect-square ${bg} rounded-2xl flex items-center justify-center transition-all group-hover:scale-[1.04] group-hover:shadow-md`}>
                  <Icon className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
