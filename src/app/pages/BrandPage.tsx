import { useParams, Link } from "react-router";
import { brands } from "../data/brands";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";
import { Package, ArrowLeft } from "lucide-react";

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useStore();
  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" strokeWidth={1} />
        <p className="text-gray-400 text-sm">Marca no encontrada</p>
        <Link to="/" className="mt-4 text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-white transition-colors">
          Ver todo el catálogo
        </Link>
      </div>
    );
  }

  const brandProducts = products.filter((p) => p.brand.toLowerCase() === brand.name.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl text-gray-600">{brand.name.slice(0, 1)}</span>
            </div>
            <div>
              <h1 className="text-2xl text-gray-900 tracking-tight">{brand.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{brandProducts.length} producto{brandProducts.length !== 1 ? "s" : ""} disponibles</p>
              {brand.description && <p className="text-xs text-gray-400 mt-1">{brand.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {brandProducts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-400 text-sm">No se encontraron productos para la marca "{brand.name}"</p>
            <Link to="/" className="mt-4 text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-white transition-colors">
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {brandProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}