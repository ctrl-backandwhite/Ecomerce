import { useState, useEffect, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useCart } from "../../context/CartContext";
import { nexaProductRepository, type NexaProduct } from "../../repositories/NexaProductRepository";
import { mapNexaProduct } from "../../mappers/NexaProductMapper";
import {
  Heart,
  Trash2,
  X,
  Package,
  ChevronRight,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { logger } from "../../lib/logger";

type Product = NexaProduct;

/* helper: extract a localised name */
function pName(p: NexaProduct): string {
  const t = p.translations?.find((tr) => tr.locale === "es") ?? p.translations?.[0];
  return t?.name ?? p.name ?? "Producto";
}

/* helper: parse sell-price range → lowest numeric value */
function pPrice(p: NexaProduct): number {
  const raw = p.sellPrice ?? "0";
  const first = raw.split("--")[0].trim();
  return parseFloat(first) || 0;
}

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
  const name = pName(product);
  const price = pPrice(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <span className="text-xs text-gray-400">{product.productType === "0" ? "Producto" : product.productType}</span>
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
              src={product.bigImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 px-6 py-6 flex flex-col">
            <h2 className="text-base text-gray-900 mb-2 leading-snug">{name}</h2>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl text-gray-900">${price.toFixed(2)}</span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs text-gray-500 leading-relaxed mb-5 flex-1">
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
              <span className="text-xs text-gray-400">
                {product.listedNum > 10
                  ? "En stock"
                  : product.listedNum > 0
                    ? `Solo ${product.listedNum} disponibles`
                    : "Sin stock"}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${product.listedNum > 10 ? "bg-green-400" : product.listedNum > 0 ? "bg-amber-400" : "bg-red-400"}`} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onRemove}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 text-sm rounded-xl py-2.5 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                Eliminar de favoritos
              </button>
              <Link
                to={`/product/${product.id}`}
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
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<NexaProduct[]>([]);
  const [loading, setLoading] = useState(true);

  /** Add favorite product to cart and remove from favorites */
  const handleAddToCart = useCallback(
    async (product: NexaProduct) => {
      const mapped = mapNexaProduct(product);
      addToCart(mapped, { quantity: 1 });
      await toggleFavorite(product.id);
      setFavorites((prev) => prev.filter((p) => p.id !== product.id));
      toast.success(`"${pName(product)}" movido al carrito`);
    },
    [addToCart, toggleFavorite]
  );

  /* Fetch real product data for each favoriteId */
  const loadFavorites = useCallback(async () => {
    if (!user.favoriteIds.length) { setFavorites([]); setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        user.favoriteIds.map((id) => nexaProductRepository.findById(id, "es"))
      );
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<NexaProduct> => r.status === "fulfilled")
        .map((r) => r.value);
      setFavorites(loaded);
    } catch (err) { logger.warn("Suppressed error", err); } finally {
      setLoading(false);
    }
  }, [user.favoriteIds]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const handleRemove = async (id: string, name: string) => {
    try {
      await toggleFavorite(id);
      setFavorites((prev) => prev.filter((p) => p.id !== id));
      toast.success(`"${name}" eliminado de favoritos`);
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error("No se pudo eliminar de favoritos");
    }
  };

  return (
    <>
      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onRemove={() => handleRemove(selected.id, pName(selected))}
        />
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base text-gray-900">Favoritos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            to="/cart"
            className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-center transition-all text-gray-400 hover:text-gray-600"
            title="Ir al carrito"
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          /* Empty state */
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
              const name = pName(product);
              const price = pPrice(product);

              return (
                <li
                  key={product.id}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(product)}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                    <img
                      src={product.bigImage}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate mb-1">{name}</p>
                    <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-900">${price.toFixed(2)}</p>
                  </div>

                  {/* Move to cart */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all flex-shrink-0"
                    title="Mover al carrito"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(product.id, name); }}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 flex items-center justify-center transition-all flex-shrink-0"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
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