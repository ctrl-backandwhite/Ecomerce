import { useCompare } from "../context/CompareContext";
import { Star, X, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "sonner";

const SPEC_ROWS_BASE = [
  { label: "Categoría", key: "category", render: (v: any) => v || "—" },
  { label: "Marca", key: "brand", render: (v: any) => v || "—" },
  { label: "Valoración", key: "rating", render: (v: any) => v !== undefined ? `${v} / 5` : "—" },
  { label: "Reseñas", key: "reviews", render: (v: any) => v !== undefined ? `${v} opiniones` : "—" },
  { label: "Stock", key: "stock", render: (v: any) => v !== undefined ? `${v} uds.` : "—" },
  { label: "SKU", key: "sku", render: (v: any) => v || "—" },
  { label: "Peso", key: "weight", render: (v: any) => v !== undefined ? `${v} kg` : "—" },
  { label: "Clase fiscal", key: "taxClass", render: (v: any) => v || "—" },
];

function buildSpecRows(formatPrice: (n: number) => string) {
  return [
    { label: "Precio", key: "price", render: (v: any) => v !== undefined ? formatPrice(v) : "—" },
    ...SPEC_ROWS_BASE,
  ];
}

export function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const SPEC_ROWS = buildSpecRows(formatPrice);

  const handleAdd = (p: any) => {
    addToCart(p);
    toast.success("Añadido al carrito");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">⚖️</span>
          </div>
          <p className="text-gray-900 mb-2">No hay productos para comparar</p>
          <p className="text-sm text-gray-400 mb-6">Usa el botón "Comparar" en las tarjetas de producto para añadirlos aquí.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-2">
              <ArrowLeft className="w-3 h-3" /> Seguir comprando
            </Link>
            <h1 className="text-xl text-gray-900 tracking-tight">Comparar productos</h1>
          </div>
          <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg h-7 px-3 hover:border-red-200 transition-colors">
            Limpiar todo
          </button>
        </div>

        {/* Product columns */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <div style={{ minWidth: `${200 + items.length * 200}px` }}>

            {/* Header row: product cards */}
            <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
              <div className="p-5 border-r border-gray-100 flex items-end">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Característica</p>
              </div>
              {items.map(p => (
                <div key={p.id} className="p-5 border-r last:border-r-0 border-gray-100">
                  <div className="relative">
                    <button
                      onClick={() => remove(p.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <img src={p.image} alt={p.name} className="w-full h-36 object-contain rounded-xl bg-gray-50 p-2 mb-3" />
                    <p className="text-xs text-gray-400 mb-1">{p.brand}</p>
                    <Link to={`/product/${p.id}`} className="text-sm text-gray-900 leading-snug hover:underline line-clamp-2 block mb-2">
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-700">{p.rating}</span>
                      <span className="text-xs text-gray-400">({p.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg text-gray-900">{formatPrice(p.price)}</span>
                      {p.originalPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</span>}
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      className="w-full flex items-center justify-center gap-1.5 h-8 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Spec rows */}
            {SPEC_ROWS.map((row, ri) => (
              <div
                key={row.key}
                className={`grid border-b last:border-b-0 border-gray-50 ${ri % 2 === 0 ? "" : "bg-gray-50/40"}`}
                style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
              >
                <div className="px-5 py-3.5 border-r border-gray-100 flex items-center">
                  <p className="text-xs text-gray-500">{row.label}</p>
                </div>
                {items.map(p => (
                  <div key={p.id} className="px-5 py-3.5 border-r last:border-r-0 border-gray-100">
                    <p className="text-sm text-gray-900">{row.render((p as any)[row.key])}</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Attributes (dynamic) */}
            {items.some(p => p.attributes?.length > 0) && (
              <>
                <div className="grid bg-gray-500/5" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
                  <div className="px-5 py-2.5 border-r border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Especificaciones</p>
                  </div>
                  {items.map(p => <div key={p.id} className="border-r last:border-r-0 border-gray-100" />)}
                </div>
                {Array.from(new Set(items.flatMap(p => p.attributes?.map((a: any) => a.name) ?? []))).slice(0, 10).map((attrName, ai) => (
                  <div
                    key={attrName}
                    className={`grid border-b last:border-b-0 border-gray-50 ${ai % 2 === 0 ? "" : "bg-gray-50/40"}`}
                    style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
                  >
                    <div className="px-5 py-3 border-r border-gray-100">
                      <p className="text-xs text-gray-400">{attrName}</p>
                    </div>
                    {items.map(p => {
                      const attr = p.attributes?.find((a: any) => a.name === attrName);
                      return (
                        <div key={p.id} className="px-5 py-3 border-r last:border-r-0 border-gray-100">
                          <p className="text-xs text-gray-700">{attr?.value ?? "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}