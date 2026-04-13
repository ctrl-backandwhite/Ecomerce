import { X, Package, Pencil } from "lucide-react";
import type { AdminProduct } from "../../repositories/NexaProductAdminRepository";

export function ProductDetailDrawer({ product, categoryName, onClose, onEdit }: {
  product: AdminProduct;
  categoryName?: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const price = parseFloat(product.sellPrice) || 0;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm text-gray-900">Detalle del producto</h2>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors">
              <Pencil className="w-3 h-3" strokeWidth={1.5} /> Editar
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="bg-gray-100 rounded-xl overflow-hidden">
            {product.bigImage ? (
              <img src={product.bigImage} alt={product.name} className="w-full max-h-80 object-contain mx-auto" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-200" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lg text-gray-900 mb-1">{product.name}</h3>
            {categoryName && <p className="text-xs text-gray-400">{categoryName}</p>}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Precio</p>
              <p className="text-lg text-gray-900">${price.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Stock</p>
              <p className="text-lg text-gray-900">{product.warehouseInventoryNum}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">SKU</p>
              <p className="text-sm text-gray-700 font-mono">{product.sku || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tipo</p>
              <p className="text-sm text-gray-700">{product.productType || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Listados</p>
              <p className="text-sm text-gray-700">{product.listedNum}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Video</p>
              <p className="text-sm text-gray-700">{product.isVideo ? "Sí" : "No"}</p>
            </div>
          </div>

          {/* Translations */}
          {product.translations && product.translations.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Traducciones</p>
              <div className="space-y-1">
                {product.translations.map(t => (
                  <div key={t.locale} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-400 uppercase font-mono w-8">{t.locale}</span>
                    <span className="text-gray-700">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Variantes ({product.variants.length})</p>
              <div className="space-y-2">
                {product.variants.map(v => (
                  <div key={v.vid} className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">{v.variantNameEn || v.variantSku}</span>
                      <span className="text-xs text-gray-900">${v.variantSellPrice?.toFixed(2) || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      {v.variantSku && <span>SKU: {v.variantSku}</span>}
                      {v.variantKey && <span>Key: {v.variantKey}</span>}
                      {v.variantWeight > 0 && <span>{v.variantWeight}kg</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-4 space-y-1">
            <p>Creado: {product.createdAt ? new Date(product.createdAt).toLocaleString() : "—"}</p>
            <p>Actualizado: {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "—"}</p>
            <p className="font-mono">ID: {product.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
