import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { products } from "../../data/products";
import { useCart } from "../../context/CartContext";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  X,
  Package,
  ChevronRight,
  Plus,
  Minus,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

type Product = typeof products[0];

/* ── Product detail modal ─────────────────────────────────── */
function ProductModal({
  product,
  onClose,
  onRemove,
}: {
  product: Product;
  onClose: () => void;
  onRemove: () => void;
}) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast.success(`"${product.name}" añadido al carrito`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{product.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{product.subcategory}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row overflow-y-auto flex-1">

          {/* Image */}
          <div className="relative sm:w-72 flex-shrink-0 bg-gray-50 flex items-center justify-center min-h-56">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount && (
              <span className="absolute top-3 left-3 bg-gray-600 text-white text-xs px-2 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 px-6 py-6 flex flex-col">
            <h2 className="text-base text-gray-900 mb-2 leading-snug">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{product.rating}</span>
              <span className="text-xs text-gray-300">({product.reviews} reseñas)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl text-gray-900">${product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-300 line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
              )}
              {discount && (
                <span className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                  Ahorras ${(product.originalPrice! - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed mb-5 flex-1">
              {product.description}
            </p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
              <span className="text-xs text-gray-400">
                {product.stock > 10
                  ? "En stock"
                  : product.stock > 0
                  ? `Solo ${product.stock} disponibles`
                  : "Sin stock"}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? "bg-green-400" : product.stock > 0 ? "bg-amber-400" : "bg-red-400"}`} />
            </div>

            {/* Qty selector */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs text-gray-400">Cantidad</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <span className="w-10 text-center text-sm text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 text-sm rounded-xl py-2.5 hover:bg-gray-300 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                Añadir al carrito
              </button>
              <button
                onClick={onRemove}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-red-400 hover:bg-red-50 hover:border-red-100 transition-colors"
                title="Eliminar de favoritos"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <Link
                to={`/producto/${product.id}`}
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors"
                title="Ver página del producto"
              >
                <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export function ProfileFavoritos() {
  const { user, toggleFavorite } = useUser();
  const [selected, setSelected] = useState<Product | null>(null);

  const favorites = products.filter((p) => user.favoriteIds.includes(p.id));

  const handleRemove = (id: string, name: string) => {
    toggleFavorite(id);
    toast.success(`"${name}" eliminado de favoritos`);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <>
      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onRemove={() => handleRemove(selected.id, selected.name)}
        />
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base text-gray-900">Favoritos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Empty state */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-base text-gray-900 mb-2">Sin favoritos aún</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Guarda los productos que te gusten para encontrarlos fácilmente más adelante.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-300 transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {favorites.map((product) => {
              const discount = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : null;

              return (
                <li
                  key={product.id}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(product)}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{product.category} · {product.subcategory}</p>
                    <p className="text-sm text-gray-900 truncate mb-1">{product.name}</p>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-500">{product.rating}</span>
                      <span className="text-xs text-gray-300">({product.reviews})</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-900">${product.price.toLocaleString()}</p>
                    {product.originalPrice && (
                      <p className="text-xs text-gray-300 line-through">${product.originalPrice.toLocaleString()}</p>
                    )}
                    {discount && (
                      <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(product.id, product.name); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}