import { Star, ShoppingCart, Heart, BarChart2, Eye, Check, Truck } from "lucide-react";
import { Link } from "react-router";
import { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "sonner";
import { useState } from "react";
import { QuickViewModal } from "./QuickViewModal";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { add: addCompare, has: inCompare } = useCompare();
  const { toggleFavorite, isFavorite } = useUser();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const liked = isFavorite(product.id);
  const [quickView, setQuickView] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.variants?.length > 1) {
      toast.message("Selecciona las opciones del producto");
      return;
    }
    addToCart(product);
    toast.success("Producto agregado al carrito");
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    addCompare(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    setQuickView(true);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const stockCount = typeof product.stock === "number" ? product.stock : Number.POSITIVE_INFINITY;
  const isOutOfStock = product.stockStatus === "out_of_stock" || stockCount === 0;
  const lowStock = !isOutOfStock && stockCount > 0 && stockCount < 10;
  const soldText = product.reviews > 0
    ? `${product.reviews} ${product.reviews === 1 ? "reseña" : "reseñas"}`
    : null;

  return (
    <>
      <Link
        to={`/product/${product.id}`}
        state={{ from: window.location.pathname + window.location.search }}
        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-square bg-white overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 group-hover:scale-[1.04] transition-transform duration-300"
          />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
              <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold tracking-wide bg-red-500 text-white rounded">
                -{discount}%
              </span>
            )}
            {product.featured && (
              <span className="inline-flex items-center h-5 px-1.5 text-[10px] tracking-wide bg-gray-900 text-white rounded">
                Destacado
              </span>
            )}
          </div>

          {/* Top-right action buttons (visible on hover) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-colors ${liked ? "bg-red-50 border border-red-200" : "bg-white hover:bg-gray-50 border border-gray-200"}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) { toast.error("Inicia sesión para agregar favoritos"); return; }
                toggleFavorite(product.id);
              }}
              title={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} strokeWidth={1.5} />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-colors ${inCompare(product.id)
                ? "bg-gray-900 text-white border border-gray-900"
                : "bg-white hover:bg-gray-50 text-gray-500 border border-gray-200"}`}
              onClick={handleCompare}
              title="Comparar"
            >
              {inCompare(product.id)
                ? <Check className="w-3.5 h-3.5" />
                : <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-colors bg-white hover:bg-gray-50 text-gray-500 border border-gray-200"
              onClick={handleQuickView}
              title="Vista rápida"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Stock ribbon */}
          {lowStock && (
            <div className="absolute bottom-0 inset-x-0 bg-amber-500/95 text-white text-[11px] px-3 py-1 backdrop-blur-sm">
              ¡Solo {stockCount} disponibles!
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full">Sin stock</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex-1 flex flex-col">
          {/* Brand / category */}
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 truncate">
            {product.brand || product.category}
          </div>

          {/* Title */}
          <h3 className="text-[13px] text-gray-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-700 transition-colors">
            {product.name}
          </h3>

          {/* Rating row */}
          <div className="flex items-center gap-1 mb-2 min-h-[16px]">
            {product.rating > 0 ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                      strokeWidth={1}
                    />
                  ))}
                </div>
                {soldText && (
                  <span className="text-[11px] text-gray-500 ml-1">({product.reviews})</span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-gray-400">Sin reseñas aún</span>
            )}
          </div>

          {/* Price block */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl text-gray-900 tracking-tight leading-none">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through leading-none">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {discount > 0 && product.originalPrice && (
              <p className="text-[11px] text-green-700 mt-1">
                Ahorras {formatPrice(product.originalPrice - product.price)}
              </p>
            )}

            {/* Shipping hint */}
            <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-500">
              <Truck className="w-3 h-3" strokeWidth={1.5} />
              <span>Envío disponible</span>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="mt-3 w-full px-3 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Agregar al carrito</span>
            </button>
          </div>
        </div>
      </Link>

      <QuickViewModal product={quickView ? product : null} onClose={() => setQuickView(false)} />
    </>
  );
}
