import { Link } from "react-router";
import { ArrowRight, Star } from "lucide-react";
import { products } from "../data/products";

const CATEGORY_ORDER = [
  "Electrónica",
  "Moda",
  "Audio",
  "Gaming",
  "Fotografía",
  "Wearables",
  "Hogar",
  "Accesorios",
];

function MiniProductCard({ product }: { product: (typeof products)[0] }) {
  const discount =
    product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex-shrink-0 w-44 sm:w-48 bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount && (
          <span className="absolute top-2 left-2 text-[10px] tracking-wide px-1.5 py-0.5 bg-gray-900 text-white rounded">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
          <span className="text-[10px] text-gray-500">{product.rating}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm text-gray-900">${product.price}</span>
          {product.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CategoryRow({ category }: { category: string }) {
  const categoryProducts = products.filter((p) => p.category === category);
  if (categoryProducts.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-gray-900 rounded-full" />
          <h3 className="text-lg tracking-tight text-gray-900">{category}</h3>
          <span className="text-xs text-gray-400">
            {categoryProducts.length} productos
          </span>
        </div>
        <Link
          to={`/productos?category=${category}`}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors group"
        >
          Ver todos
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {categoryProducts.map((product) => (
          <MiniProductCard key={product.id} product={product} />
        ))}

        {/* "Ver más" card */}
        <Link
          to={`/productos?category=${category}`}
          className="flex-shrink-0 w-44 sm:w-48 aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-100 transition-all group"
        >
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
            Ver {category}
          </span>
        </Link>
      </div>
    </div>
  );
}

export function CategoryProducts() {
  return (
    <section className="py-16 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-2">
            Productos por Categoría
          </h2>
          <p className="text-gray-500">Explora nuestra selección completa</p>
        </div>

        {/* Category rows */}
        <div className="flex flex-col gap-12">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryRow key={cat} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
