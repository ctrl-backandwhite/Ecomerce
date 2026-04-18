import { useParams, Link } from "react-router";
import { ProductCard } from "../components/ProductCard";
import { useBrands } from "../hooks/useBrands";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { searchRepository } from "../repositories/SearchRepository";
import { mapSearchHitToProduct } from "../mappers/NexaProductMapper";

const PAGE_SIZE = 48;

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const { brands } = useBrands();
  const brand = brands.find((b) => b.slug === slug);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setProducts([]);
    setPage(0);

    searchRepository
      .search({ q: "", brand: slug, page: 0, size: PAGE_SIZE }, controller.signal)
      .then((res) => {
        setProducts(res.results.map(mapSearchHitToProduct));
        setTotalHits(res.totalHits);
        setHasMore(res.results.length < res.totalHits);
        setPage(0);
      })
      .catch((e) => { if ((e as DOMException).name !== "AbortError") console.error(e); })
      .finally(() => setLoading(false));

    return () => abortRef.current?.abort();
  }, [slug]);

  const loadMore = useCallback(() => {
    if (!slug || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    searchRepository
      .search({ q: "", brand: slug, page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setProducts((prev) => [...prev, ...res.results.map(mapSearchHitToProduct)]);
        setTotalHits(res.totalHits);
        setHasMore((nextPage + 1) * PAGE_SIZE < res.totalHits);
        setPage(nextPage);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [slug, loading, hasMore, page]);

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
              <p className="text-sm text-gray-400 mt-0.5">{totalHits} producto{totalHits !== 1 ? "s" : ""} disponibles</p>
              {brand.description && <p className="text-xs text-gray-400 mt-1">{brand.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3.5 space-y-2">
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                  <div className="h-2 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-14 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-400 text-sm">No se encontraron productos para la marca "{brand.name}"</p>
            <Link to="/" className="mt-4 text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-white transition-colors">
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-2 h-10 px-6 text-sm text-gray-700 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Cargar más
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}