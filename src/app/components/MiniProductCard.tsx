import { Link } from "react-router";
import type { Product } from "../types/product";
import { useCurrency } from "../context/CurrencyContext";
import { urls } from "../lib/urls";

interface MiniProductCardProps {
  product: Product;
}

/**
 * Compact card used in horizontal rails (suggestions, recently-viewed,
 * "also bought" strips). Image on top, name in one truncated line, price
 * below — no action icons, no long description — so many of them fit in
 * the viewport without overwhelming the user.
 */
export function MiniProductCard({ product }: MiniProductCardProps) {
  const { formatPrice } = useCurrency();
  const image = product.images?.[0]?.url || product.images?.[0] as unknown as string || "";

  return (
    <Link
      to={urls.product(product.pid || product.id)}
      className="group w-[160px] sm:w-[180px] flex-shrink-0 block"
    >
      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:border-gray-300 transition-colors">
        {image ? (
          <img
            src={typeof image === "string" ? image : (image as { url: string }).url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-xs text-gray-800 line-clamp-2 leading-snug min-h-[2rem]">
          {product.name}
        </p>
        <p className="text-sm text-gray-900 mt-1">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
