import { Star, ShoppingCart, Heart, BarChart2, Eye, Check } from "lucide-react";
import { Link } from "react-router";
import { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { QuickViewModal } from "./QuickViewModal";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { add: addCompare, has: inCompare } = useCompare();
  const { toggleFavorite, isFavorite } = useUser();
  const { isAuthenticated } = useAuth();
  const liked = isFavorite(product.id);
  const imgRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [quickView, setQuickView] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -15;
    const rotateY = ((x - cx) / cx) * 15;
    setTransform(
      `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.06,1.06,1.06)`
    );
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.22 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <>
      <Link
        to={`/producto/${product.id}`}
        state={{ from: window.location.pathname + window.location.search }}
        className="group"
        style={{ display: "block" }}
      >
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">

          {/* Image with 3D effect */}
          <div
            ref={imgRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: "preserve-3d" }}
            className="relative aspect-square bg-white overflow-hidden cursor-pointer"
          >
            <div
              style={{
                transform,
                transition: glare.opacity === 0 ? "transform 0.55s ease" : "transform 0.08s ease",
                willChange: "transform",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-3"
              />
              {/* Glare */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 65%)`,
                  transition: "opacity 0.2s ease",
                }}
              />
            </div>

            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
                -{discount}%
              </div>
            )}

            {/* Action buttons overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button
                className={`w-7 h-7 flex items-center justify-center rounded-full shadow-sm transition-colors ${liked ? "bg-red-50 border border-red-200" : "bg-white/90 hover:bg-white"
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) { toast.error("Inicia sesión para agregar favoritos"); return; }
                  toggleFavorite(product.id);
                }}
                title={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500 text-red-500" : ""}`} strokeWidth={1.5} />
              </button>
              <button
                className={`w-7 h-7 flex items-center justify-center rounded-full shadow-sm transition-colors ${inCompare(product.id)
                  ? "bg-gray-600 text-white"
                  : "bg-white/90 hover:bg-white text-gray-600"
                  }`}
                onClick={handleCompare}
                title="Comparar"
              >
                {inCompare(product.id)
                  ? <Check className="w-3.5 h-3.5" />
                  : <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                }
              </button>
            </div>

            {/* Quick view — aparece en hover */}
            <button
              onClick={handleQuickView}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 h-7 px-3 bg-white/95 text-gray-700 text-xs rounded-full shadow-sm border border-gray-100 z-10 whitespace-nowrap"
            >
              <Eye className="w-3 h-3" strokeWidth={1.5} /> Vista rápida
            </button>

            {product.stock < 10 && (
              <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded z-10">
                ¡Últimas unidades!
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 truncate">
              {product.category}
            </div>
            <h3 className="text-base mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-1 text-sm mb-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-900">{product.rating}</span>
                <span className="text-gray-500">({product.reviews})</span>
              </div>
            )}
            <div className="mb-3 min-h-[32px]" />

            {/* Price */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-3">
                {product.priceMax && product.priceMax !== product.price ? (
                  <span className="text-2xl text-gray-900">
                    ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-base text-gray-400 mx-0.5">–</span>
                    ${product.priceMax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-2xl text-gray-900">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar al carrito</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick View Modal */}
      <QuickViewModal product={quickView ? product : null} onClose={() => setQuickView(false)} />
    </>
  );
}