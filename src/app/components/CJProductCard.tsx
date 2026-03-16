import { Link } from "react-router";
import { ShoppingCart, Package, ExternalLink } from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import type { CJProduct } from "../services/cjApi";
import type { Product } from "../data/products";

interface Props {
  product: CJProduct;
}

/** Convierte un CJProduct al shape mínimo que CartContext espera */
function cjToProduct(p: CJProduct): Product {
  return {
    id:               p.pid,
    name:             p.productNameEn,
    slug:             p.pid,
    sku:              `CJ-${p.pid.slice(0, 8).toUpperCase()}`,
    brand:            "NEXA",
    description:      "",
    shortDescription: p.categoryName ?? "",
    price:            p.sellPrice ?? 0,
    taxClass:         "standard",
    category:         p.categoryName ?? "Dropshipping",
    subcategory:      "",
    keywords:         [],
    image:            p.productImage ?? "",
    images:           p.productImage ? [{ url: p.productImage, alt: p.productNameEn, position: 0 }] : [],
    rating:           0,
    reviews:          0,
    stock:            999,
    barcode:          "",
    stockStatus:      "in_stock",
    manageStock:      false,
    allowBackorder:   true,
    attributes:       [],
    variants:         [],
    weight:           p.productWeight ?? 0,
    dimensions:       { length: 0, width: 0, height: 0 },
    shippingClass:    "standard",
    metaTitle:        p.productNameEn,
    metaDescription:  "",
    status:           "active",
    visibility:       "public",
    featured:         false,
  };
}

export function CJProductCard({ product }: Props) {
  const { addToCart } = useCart();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cjToProduct(product));
    toast.success("Producto añadido al carrito");
  }

  const price = product.sellPrice ?? 0;

  return (
    <Link to={`/dropshipping/${product.pid}`} className="group block">
      <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 h-full flex flex-col">

        {/* ── Imagen ── */}
        <div className="aspect-square relative overflow-hidden bg-gray-50 flex-shrink-0">
          {product.productImage ? (
            <img
              src={product.productImage}
              alt={product.productNameEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
            </div>
          )}

          {/* Badge CJ */}
          <span className="absolute top-2 left-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-1.5 py-0.5 tracking-wide">
            CJ
          </span>

          {/* Ver detalle */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="p-3.5 flex flex-col flex-1">
          {product.categoryName && (
            <p className="text-[11px] text-gray-400 mb-1 truncate">
              {product.categoryName}
            </p>
          )}

          <h3 className="text-xs text-gray-800 leading-snug line-clamp-2 flex-1 mb-3">
            {product.productNameEn}
          </h3>

          {/* Peso si disponible */}
          {product.productWeight && product.productWeight > 0 && (
            <p className="text-[11px] text-gray-300 mb-2">
              {product.productWeight}g
            </p>
          )}

          {/* Precio + Añadir */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-900">
              ${price.toFixed(2)}
            </span>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1 h-7 px-2.5 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-3 h-3" strokeWidth={1.5} />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}