import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft, ShoppingCart, Package, Truck, Shield,
  RefreshCw, Loader2, AlertTriangle, ChevronRight,
  ExternalLink, Tag, Weight,
} from "lucide-react";
import { useCJ } from "../context/CJContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import type { CJProductDetail as CJProductDetailType, CJProductVariant } from "../services/cjApi";
import type { Product } from "../data/products";

/** Convierte CJProductDetail + variante seleccionada al shape de Product */
function cjDetailToProduct(
  p: CJProductDetailType,
  variant?: CJProductVariant,
): Product {
  const price = variant?.variantPrice ?? p.sellPrice ?? 0;
  const stock = variant?.variantStock ?? 999;
  return {
    id:               p.pid,
    name:             p.productNameEn,
    slug:             p.pid,
    sku:              variant?.variantSku ?? p.productSku ?? `CJ-${p.pid.slice(0, 8).toUpperCase()}`,
    brand:            "CJ Dropshipping",
    description:      p.description ?? "",
    shortDescription: p.categoryName ?? "CJ Dropshipping",
    price,
    taxClass:         "standard",
    category:         p.categoryName ?? "Dropshipping",
    subcategory:      "",
    keywords:         [],
    image:            p.productImage ?? "",
    images:           p.productImage ? [{ url: p.productImage, alt: p.productNameEn, position: 0 }] : [],
    rating:           0,
    reviews:          0,
    stock,
    barcode:          "",
    stockStatus:      stock > 0 ? "in_stock" : "out_of_stock",
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

export function CJProductDetail() {
  const { pid } = useParams<{ pid: string }>();
  const { productDetail, detailLoading, detailError, fetchProductDetail, clearDetail } = useCJ();
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [activeImage, setActiveImage] = useState<string>("");
  const [qty, setQty] = useState(1);

  /* ── Carga ───────────────────────────────────────────────── */
  useEffect(() => {
    if (pid) {
      clearDetail();
      fetchProductDetail(pid);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Imagen inicial ─────────────────────────────────────── */
  useEffect(() => {
    if (productDetail) {
      setActiveImage(productDetail.productImage ?? "");
      setSelectedVariant(0);
    }
  }, [productDetail]);

  /* ── Handlers ────────────────────────────────────────────── */
  function handleAddToCart() {
    if (!productDetail) return;
    const variant = productDetail.variants?.[selectedVariant];
    const productToAdd = cjDetailToProduct(productDetail, variant);

    for (let i = 0; i < qty; i++) {
      addToCart(productToAdd);
    }
    toast.success(`${productDetail.productNameEn} añadido al carrito`);
  }

  /* ── Vistas de estado ────────────────────────────────────── */
  if (detailLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4 pt-4">
            <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse mt-6" />
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <AlertTriangle className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-600 mb-1">No se pudo cargar el producto</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm">{detailError}</p>
        <div className="flex gap-2">
          <button
            onClick={() => pid && fetchProductDetail(pid)}
            className="flex items-center gap-1.5 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            Reintentar
          </button>
          <Link
            to="/dropshipping"
            className="flex items-center gap-1.5 h-8 px-4 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!productDetail) return null;

  const p = productDetail;
  const variants = p.variants ?? [];
  const currentVariant = variants[selectedVariant];
  const currentPrice = currentVariant?.variantPrice ?? p.sellPrice ?? 0;
  const currentStock = currentVariant?.variantStock ?? 999;

  /* Galería: imagen principal + variantes con imagen + productImages */
  const allImages = Array.from(
    new Set([
      p.productImage,
      ...(p.productImages ?? []),
      ...variants.filter((v) => v.variantImage).map((v) => v.variantImage as string),
    ].filter(Boolean)),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        <Link to="/dropshipping" className="hover:text-gray-600 transition-colors">Dropshipping CJ</Link>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        <span className="text-gray-600 truncate max-w-xs">{p.productNameEn}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">

        {/* ── Galería ── */}
        <div className="flex flex-col gap-3">
          {/* Imagen principal */}
          <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={p.productNameEn}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-16 h-16 text-gray-200" strokeWidth={1.5} />
            )}
          </div>

          {/* Miniaturas */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === img
                      ? "border-gray-500"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col">

          {/* Categoría + badge */}
          <div className="flex items-center gap-2 mb-2">
            {p.categoryName && (
              <span className="text-[11px] text-gray-400">{p.categoryName}</span>
            )}
            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-1.5 py-0.5">
              CJ Dropshipping
            </span>
          </div>

          {/* Nombre */}
          <h1 className="text-base text-gray-900 leading-snug mb-4">
            {p.productNameEn}
          </h1>

          {/* Precio */}
          <div className="mb-5">
            <span className="text-2xl text-gray-900 tracking-tight">
              ${currentPrice.toFixed(2)}
            </span>
            {currentVariant && currentVariant.variantPrice !== p.sellPrice && (
              <span className="text-xs text-gray-400 ml-2">precio variante</span>
            )}
          </div>

          {/* Variantes */}
          {variants.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2">
                Variante: <span className="text-gray-700">{currentVariant?.variantNameEn ?? `Opción ${selectedVariant + 1}`}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {variants.map((v, i) => (
                  <button
                    key={v.vid}
                    onClick={() => {
                      setSelectedVariant(i);
                      if (v.variantImage) setActiveImage(v.variantImage);
                    }}
                    className={`flex items-center gap-1.5 h-8 px-3 text-xs rounded-xl border transition-all ${
                      selectedVariant === i
                        ? "border-gray-600 bg-gray-600 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    } ${v.variantStock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={v.variantStock === 0}
                  >
                    {v.variantImage && (
                      <img
                        src={v.variantImage}
                        alt=""
                        className="w-4 h-4 rounded object-cover flex-shrink-0"
                      />
                    )}
                    {v.variantNameEn ?? v.variantSku}
                    {v.variantStock === 0 && (
                      <span className="text-[10px] opacity-60 ml-0.5">Agotado</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${currentStock > 0 ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-xs text-gray-500">
              {currentStock > 0
                ? currentStock > 100 ? "En stock" : `${currentStock} disponibles`
                : "Sin stock"}
            </span>
          </div>

          {/* Cantidad */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-gray-500 w-16">Cantidad</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">−</span>
              </button>
              <span className="w-8 text-center text-xs text-gray-900">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">+</span>
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={currentStock === 0}
            className="flex items-center justify-center gap-2 h-11 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-3"
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
            Añadir al carrito
          </button>

          {/* Ver en CJ */}
          <a
            href={`https://cjdropshipping.com/product/${p.pid}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-9 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            Ver en CJ Dropshipping
          </a>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-gray-100">
            {[
              { icon: Truck,    text: "Envío directo", sub: "desde almacén CJ" },
              { icon: Shield,   text: "Garantía",      sub: "protección CJ" },
              { icon: RefreshCw, text: "Devoluciones", sub: "según política CJ" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex flex-col items-center text-center gap-1">
                <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                <span className="text-[11px] text-gray-600">{text}</span>
                <span className="text-[10px] text-gray-400">{sub}</span>
              </div>
            ))}
          </div>

          {/* SKU + Peso */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            {p.productSku && (
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">SKU:</span>
                <span className="text-xs text-gray-600 font-mono">{p.productSku}</span>
              </div>
            )}
            {p.productWeight && p.productWeight > 0 && (
              <div className="flex items-center gap-2">
                <Weight className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">Peso:</span>
                <span className="text-xs text-gray-600">{p.productWeight}g</span>
              </div>
            )}
            {p.pid && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">PID:</span>
                <span className="text-xs text-gray-400 font-mono truncate">{p.pid}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Descripción ── */}
      {p.description && (
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-sm text-gray-900 mb-4">Descripción del producto</h2>
          <div
            className="prose prose-sm max-w-none text-gray-600 text-xs leading-relaxed [&_img]:rounded-xl [&_img]:max-w-full [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-gray-100 [&_td]:p-2 [&_th]:border [&_th]:border-gray-100 [&_th]:p-2 [&_th]:bg-gray-50"
            dangerouslySetInnerHTML={{ __html: p.description }}
          />
        </div>
      )}

      {/* ── Variantes tabla ── */}
      {variants.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h2 className="text-sm text-gray-900 mb-4">
            Variantes disponibles ({variants.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-400 font-normal">Imagen</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-normal">SKU</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-normal">Variante</th>
                  <th className="text-right py-2 pr-4 text-gray-400 font-normal">Precio</th>
                  <th className="text-right py-2 text-gray-400 font-normal">Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr
                    key={v.vid}
                    onClick={() => { setSelectedVariant(i); if (v.variantImage) setActiveImage(v.variantImage); }}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedVariant === i ? "bg-gray-50" : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="py-2 pr-4">
                      {v.variantImage ? (
                        <img
                          src={v.variantImage}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-400 font-mono">{v.variantSku}</td>
                    <td className="py-2 pr-4 text-gray-700">{v.variantNameEn ?? "—"}</td>
                    <td className="py-2 pr-4 text-right text-gray-900">${v.variantPrice?.toFixed(2)}</td>
                    <td className={`py-2 text-right ${v.variantStock === 0 ? "text-red-400" : "text-green-600"}`}>
                      {v.variantStock === 0 ? "Agotado" : v.variantStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Volver ── */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link
          to="/dropshipping"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Volver al catálogo CJ
        </Link>
      </div>
    </div>
  );
}