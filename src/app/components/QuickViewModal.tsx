import { X, Star, ShoppingCart, Heart, ExternalLink, Check, BarChart2, Quote } from "lucide-react";
import { Link } from "react-router";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { getBestReview, getReviewStats } from "../data/reviewSynthesizer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product: p, onClose }: Props) {
  const { addToCart } = useCart();
  const { add, has }  = useCompare();

  const featuredReview = useMemo(() =>
    p ? getBestReview(p.id, p.name, p.category) : null,
    [p?.id, p?.name, p?.category]
  );

  const reviewStats = useMemo(() =>
    p ? getReviewStats(p.id, p.name, p.category) : { avgRating: 0, count: 0 },
    [p?.id, p?.name, p?.category]
  );

  const discount = p?.originalPrice
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;

  return (
    <AnimatePresence>
      {p && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>

              <div className="grid sm:grid-cols-2">
                {/* Image */}
                <div className="bg-gray-50 relative h-64 sm:h-auto">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-8" />
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{p.brand} · {p.category}</p>
                    <h2 className="text-base text-gray-900 leading-snug line-clamp-3">{p.name}</h2>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(reviewStats.avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{reviewStats.avgRating} ({reviewStats.count} reseñas)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl text-gray-900">${p.price}</span>
                    {p.originalPrice && <span className="text-sm text-gray-400 line-through">${p.originalPrice}</span>}
                  </div>

                  {/* Short description */}
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{p.shortDescription || p.description}</p>

                  {/* Featured review */}
                  {featuredReview && (
                    <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <Quote className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 leading-snug italic line-clamp-2">
                          {featuredReview.body.slice(0, 110)}{featuredReview.body.length > 110 ? "…" : ""}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">— {featuredReview.author}</p>
                      </div>
                    </div>
                  )}

                  {/* Stock */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-xs text-gray-500">
                      {p.stock > 0 ? `${p.stock} en stock` : "Sin stock"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { addToCart(p); toast.success("Añadido al carrito"); onClose(); }}
                      className="flex-1 flex items-center justify-center gap-2 h-9 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Agregar
                    </button>
                    <button
                      onClick={() => add(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
                        has(p.id) ? "border-gray-500 bg-gray-500 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {has(p.id) ? <Check className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      <Heart className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Full detail link */}
                  <Link
                    to={`/producto/${p.id}`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-1"
                  >
                    Ver ficha completa <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}