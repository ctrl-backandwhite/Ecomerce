import { X, Package, Heart, ShoppingCart } from "lucide-react";
import type { AdminProduct } from "../../repositories/NexaProductAdminRepository";

export function ProductPreviewModal({ product, categoryName, onClose }: {
  product: AdminProduct;
  categoryName?: string;
  onClose: () => void;
}) {
  const price = parseFloat(product.sellPrice) || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-50 rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">Vista previa</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Cómo se verá en la tienda</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="relative h-56 bg-white overflow-hidden">
              {product.bigImage ? (
                <img src={product.bigImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                </div>
              )}
              <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors z-10">
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {categoryName && (
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{categoryName}</div>
              )}
              <h3 className="text-base mb-2 line-clamp-2">{product.name}</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl text-gray-900">${price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <span>SKU: {product.sku || "—"}</span>
                <span>·</span>
                <span>Stock: {product.warehouseInventoryNum}</span>
              </div>
              {product.variants && product.variants.length > 0 && (
                <div className="text-xs text-gray-400 mb-3">
                  {product.variants.length} variante{product.variants.length > 1 ? "s" : ""}
                </div>
              )}
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Agregar al carrito
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-4">Vista previa del producto en la tienda</p>
        </div>
      </div>
    </div>
  );
}
