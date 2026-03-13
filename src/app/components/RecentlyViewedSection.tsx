import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { ProductCard } from "./ProductCard";
import { Clock } from "lucide-react";

export function RecentlyViewedSection() {
  const { viewed } = useRecentlyViewed();

  if (viewed.length === 0) return null;

  return (
    <section className="py-12 px-4 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <h2 className="text-sm text-gray-900">Vistos recientemente</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {viewed.slice(0, 5).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
