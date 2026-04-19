import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router";
import { type Review } from "../types/review";
import { reviewRepository } from "../repositories/ReviewRepository";
import { useCart } from "../context/CartContext";
import { useNexaProducts } from "../hooks/useNexaProducts";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { nexaProductRepository } from "../repositories/NexaProductRepository";
import { mapNexaProductDetail } from "../mappers/NexaProductMapper";
import DOMPurify from "dompurify";
import {
  Star, ShoppingCart, Heart, Truck, Shield,
  ArrowLeft, Plus, Minus, ChevronRight, Package,
  RefreshCw, Award, Check, ThumbsUp, ChevronDown,
  MessageSquare, Pencil, Eye, Loader2, X, Grid,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { toast } from "sonner";
import type { Product } from "../types/product";

// ── Trust badges data ──────────────────────────────────────────
const TRUST_BADGES = [
  { icon: Truck, title: "Envío gratis", sub: "En compras superiores a $100" },
  { icon: Shield, title: "Garantía de 1 año", sub: "Protección total del producto" },
  { icon: RefreshCw, title: "Devoluciones gratuitas", sub: "30 días para devolver" },
  { icon: Award, title: "Producto oficial", sub: "Distribuidor autorizado" },
];

// ── Stars helper ──────────────────────────────────────────────
function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.floor(value)
            ? "fill-amber-400 text-amber-400"
            : "text-gray-200"
            }`}
          strokeWidth={1}
        />
      ))}
    </div>
  );
}

// ── Rating bar ────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-3 text-right flex-shrink-0">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={1} />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-7 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────
function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: (id: string) => void }) {
  const [helped, setHelped] = useState(false);
  const dateLabel = new Date(review.date).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${review.avatarColor}`}>
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm text-gray-900">{review.author}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                Compra verificada
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            <Stars value={review.rating} size="sm" />
            <span className="text-sm text-gray-900">{review.title}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-gray-400">¿Te resultó útil?</span>
            <button
              onClick={() => { if (!helped) { setHelped(true); onHelpful(review.id); } }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${helped
                ? "border-gray-300 text-gray-700 bg-gray-100"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
            >
              <ThumbsUp className="w-3 h-3" strokeWidth={1.5} />
              Sí · {review.helpful + (helped ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Star picker ───────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`w-7 h-7 transition-colors ${i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-200"
              }`}
            strokeWidth={1}
          />
        </button>
      ))}
      {(hover || value) > 0 && (
        <span className="ml-2 text-sm text-gray-500">{labels[hover || value]}</span>
      )}
    </div>
  );
}

// ── Reviews section ───────────────────────────────────────────
function ReviewsSection({
  productId, baseRating, baseCount, productName, productCategory,
}: {
  productId: string;
  baseRating: number;
  baseCount: number;
  productName?: string;
  productCategory?: string;
}) {
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [sort, setSort] = useState<"recent" | "helpful" | "rating_high" | "rating_low">("recent");
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newName, setNewName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Load reviews from API on mount (M-10)
  useEffect(() => {
    let cancelled = false;
    reviewRepository.findByProductId(productId, 0, 50).then(page => {
      if (!cancelled && page?.content) {
        setLocalReviews(page.content.map(r => ({
          id: r.id,
          productId: r.productId,
          author: r.author,
          avatar: r.avatar ?? r.author?.substring(0, 2).toUpperCase() ?? "?",
          rating: r.rating,
          title: r.title,
          body: r.body,
          date: r.date,
          verified: r.verified,
          helpful: r.helpful,
          images: r.images,
        })));
      }
    }).catch(() => { /* silently use empty reviews */ });
    return () => { cancelled = true; };
  }, [productId]);

  const total = localReviews.length;
  const avgRating = total > 0
    ? localReviews.reduce((s, r) => s + r.rating, 0) / total
    : baseRating;
  const displayRating = Math.round(avgRating * 10) / 10;
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: localReviews.filter((r) => r.rating === s).length,
  }));

  const featuredReview = useMemo(() => {
    return [...localReviews]
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.helpful - a.helpful)[0] ?? null;
  }, [localReviews]);

  const filtered = localReviews
    .filter((r) => filter === "all" || r.rating === parseInt(filter))
    .sort((a, b) => {
      if (sort === "helpful") return b.helpful - a.helpful;
      if (sort === "rating_high") return b.rating - a.rating;
      if (sort === "rating_low") return a.rating - b.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const visible = showAll ? filtered : filtered.slice(0, 4);

  function handleHelpful(id: string) {
    // Optimistic update + API call (M-10)
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );
    reviewRepository.voteHelpful(id).catch(() => {
      // Revert on failure
      setLocalReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful - 1 } : r))
      );
    });
  }

  function handleSubmit() {
    if (newRating === 0) { toast.error("Selecciona una valoración"); return; }
    if (!newTitle.trim()) { toast.error("Escribe un título para tu reseña"); return; }
    if (newBody.trim().length < 20) { toast.error("La reseña debe tener al menos 20 caracteres"); return; }
    if (!newName.trim()) { toast.error("Escribe tu nombre"); return; }

    // Submit to API (M-10)
    reviewRepository.create(productId, {
      rating: newRating,
      title: newTitle.trim(),
      body: newBody.trim(),
    }).then(saved => {
      const review: Review = {
        id: saved.id,
        productId: saved.productId,
        author: saved.author ?? newName.trim(),
        avatar: newName.trim().substring(0, 2).toUpperCase(),
        rating: saved.rating,
        title: saved.title,
        body: saved.body,
        date: saved.date,
        verified: saved.verified,
        helpful: 0,
      };
      setLocalReviews((prev) => [review, ...prev]);
      setSubmitted(true);
      setNewRating(0); setNewTitle(""); setNewBody(""); setNewName("");
      toast.success("¡Gracias por tu reseña!");
      setTimeout(() => { setShowForm(false); setSubmitted(false); }, 2000);
    }).catch(() => {
      // Fallback: add locally if API fails
      const colors = [
        "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700",
        "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
      ];
      const parts = newName.trim().split(" ");
      const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
      const newReview: Review = {
        id: `user-${Date.now()}`,
        productId,
        author: newName.trim(),
        avatar: initials,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        rating: newRating,
        title: newTitle.trim(),
        body: newBody.trim(),
        date: new Date().toISOString().split("T")[0],
        verified: false,
        helpful: 0,
      };
      setLocalReviews((prev) => [newReview, ...prev]);
      setSubmitted(true);
      setNewRating(0); setNewTitle(""); setNewBody(""); setNewName("");
      toast.success("¡Tu reseña se guardará cuando haya conexión!");
      setTimeout(() => { setShowForm(false); setSubmitted(false); }, 2000);
    });
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";

  return (
    <section className="mb-16">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <h2 className="text-base text-gray-900 tracking-tight">Reseñas de clientes</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {total} {total === 1 ? "reseña" : "reseñas"}
            </span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitted(false); }}
            className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            Escribir reseña
          </button>
        </div>

        {/* Write review form */}
        {showForm && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            {submitted ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-green-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900">¡Reseña publicada!</p>
                <p className="text-xs text-gray-400 mt-1">Gracias por compartir tu opinión.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Tu valoración *</label>
                  <StarPicker value={newRating} onChange={setNewRating} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Tu nombre *</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className={field} placeholder="Ej: Carlos M." />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Título *</label>
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={field} placeholder="Resumen de tu experiencia" maxLength={80} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Tu opinión * <span className="text-gray-300">({newBody.length}/500)</span>
                  </label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    className={`${field} h-28 resize-none`}
                    placeholder="Cuéntanos tu experiencia con el producto..."
                    maxLength={500}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    className="text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors"
                  >
                    Publicar reseña
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-8 px-6 py-6 border-b border-gray-100">
          <div className="flex flex-col items-center justify-center text-center min-w-[120px]">
            <span className="text-5xl text-gray-900 tracking-tight">{displayRating}</span>
            <Stars value={displayRating} size="md" />
            <span className="text-xs text-gray-400 mt-2">{total + baseCount} reseñas en total</span>
          </div>
          <div className="flex flex-col justify-center gap-2 flex-1">
            {starCounts.map(({ star, count }) => (
              <button
                key={star}
                onClick={() => setFilter(filter === String(star) as any ? "all" : String(star) as any)}
                className={`rounded-lg px-2 py-0.5 transition-colors text-left ${filter === String(star) ? "bg-amber-50" : "hover:bg-gray-50"
                  }`}
              >
                <RatingBar star={star} count={count} total={total} />
              </button>
            ))}
          </div>
        </div>

        {/* Featured pull-quote */}
        {featuredReview && filter === "all" && (
          <div className="mx-6 my-5 flex items-start gap-4 bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs ${featuredReview.avatarColor}`}>
                {featuredReview.avatar}
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i <= featuredReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} strokeWidth={1} />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs text-gray-700">{featuredReview.author}</span>
                {featuredReview.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" strokeWidth={2.5} /> Verificado
                  </span>
                )}
                <span className="text-[11px] text-gray-700 ml-1">{featuredReview.title}</span>
                <span className="text-[10px] text-gray-300 ml-auto flex-shrink-0">
                  {new Date(featuredReview.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="text-gray-300 text-base mr-0.5 leading-none">"</span>
                {featuredReview.body.slice(0, 180)}{featuredReview.body.length > 180 ? "…" : ""}
                <span className="text-gray-300 text-base ml-0.5 leading-none">"</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" strokeWidth={1.5} />
                {featuredReview.helpful} personas encontraron útil esta reseña
              </p>
            </div>
          </div>
        )}

        {/* Filters + sort */}
        {total > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === f
                    ? "border-gray-600 bg-gray-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  {f === "all" ? "Todas" : `${f} ★`}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">Ordenar:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-1.5 pr-7 bg-white appearance-none focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="recent">Más recientes</option>
                  <option value="helpful">Más útiles</option>
                  <option value="rating_high">Mayor valoración</option>
                  <option value="rating_low">Menor valoración</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        <div className="px-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <MessageSquare className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">
                {filter !== "all"
                  ? `No hay reseñas con ${filter} estrellas`
                  : "Sé el primero en dejar una reseña"}
              </p>
            </div>
          ) : (
            <>
              {visible.map((r) => (
                <ReviewCard key={r.id} review={r} onHelpful={handleHelpful} />
              ))}
              {filtered.length > 4 && (
                <div className="py-5 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl px-5 py-2.5 transition-colors"
                  >
                    {showAll ? (
                      <>Mostrar menos<ChevronDown className="w-3.5 h-3.5 rotate-180" strokeWidth={1.5} /></>
                    ) : (
                      <>Ver las {filtered.length - 4} reseñas restantes<ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /></>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Color resolver ─────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  // ── English ──────────────────────────────────────────────
  "Black": "#111827", "White": "#F9FAFB", "Grey": "#9CA3AF", "Gray": "#9CA3AF",
  "Dark Grey": "#4B5563", "Dark Gray": "#4B5563", "Light Grey": "#E5E7EB", "Light Gray": "#E5E7EB",
  "Navy Blue": "#1E3A5F", "Navy": "#1E3A5F",
  "Blue": "#3B82F6", "Dark Blue": "#1E40AF", "Light Blue": "#93C5FD", "Sky Blue": "#7DD3FC",
  "Red": "#EF4444", "Dark Red": "#991B1B", "Brick Red": "#B91C1C",
  "Green": "#22C55E", "Dark Green": "#15803D", "Light Green": "#86EFAC", "Army Green": "#4D6B2F",
  "Yellow": "#EAB308", "Gold": "#D97706", "Golden": "#D97706",
  "Orange": "#F97316", "Dark Orange": "#EA580C",
  "Pink": "#F472B6", "Light Pink": "#FBCFE8", "Hot Pink": "#EC4899", "Rose": "#FB7185",
  "Purple": "#A855F7", "Violet": "#8B5CF6", "Lilac": "#C4B5FD",
  "Khaki": "#C3B091", "Beige": "#D2B48C", "Cream": "#FFF8E7", "Ivory": "#FFFFF0",
  "Brown": "#78350F", "Coffee": "#6B3A2A", "Camel": "#C19A6B",
  "Camouflage": "#6B7B5A", "Camo": "#6B7B5A",
  "Wine": "#722F37", "Burgundy": "#800020", "Maroon": "#800000",
  "Cyan": "#06B6D4", "Teal": "#0D9488", "Turquoise": "#2DD4BF",
  "Silver": "#CBD5E1", "Bronze": "#CD7F32", "Copper": "#B87333",
  "Multicolor": "linear-gradient(135deg,#f43f5e,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)",
  // ── Spanish (legacy / mock products) ─────────────────────────
  "Titanio Negro": "#2C2C2E", "Titanio Blanco": "#F0EDE6", "Titanio Natural": "#C4A882",
  "Negro": "#111827", "Blanco": "#F9FAFB", "Gris": "#9CA3AF", "Gris Oscuro": "#4B5563",
  "Gris Claro": "#D1D5DB", "Plateado": "#CBD5E1", "Plata": "#C0C0C0",
  "Azul": "#3B82F6", "Azul Oscuro": "#1E40AF", "Azul Claro": "#93C5FD", "Azul Marino": "#1E3A5F",
  "Celeste": "#7DD3FC", "Cian": "#06B6D4", "Turquesa": "#2DD4BF",
  "Rojo": "#EF4444", "Rojo Oscuro": "#991B1B", "Coral": "#FB7185",
  "Verde": "#22C55E", "Verde Oscuro": "#15803D", "Verde Claro": "#86EFAC", "Oliva": "#6B7280",
  "Amarillo": "#EAB308", "Dorado": "#D97706", "Oro": "#B8860B",
  "Naranja": "#F97316", "Naranja Oscuro": "#EA580C",
  "Rosa": "#EC4899", "Rosa Claro": "#FBCFE8", "Fucsia": "#D946EF",
  "Morado": "#A855F7", "Violeta": "#8B5CF6", "Lila": "#C4B5FD",
  "Marrón": "#78350F", "Café": "#92400E", "Crema": "#FFF8E7",
  "Bronce": "#CD7F32", "Cobre": "#B87333",
};

function resolveColor(name: string): string {
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  const key = Object.keys(COLOR_MAP).find(
    (k) => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  if (key) return COLOR_MAP[key];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

// ── Main component ────────────────────────────────────────────
export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products } = useNexaProducts();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const currencyCode = currency?.currencyCode ?? "USD";

  const apiLocale = locale === "pt" ? "pt-BR" : locale;

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!id) { setProduct(null); setDetailLoading(false); return; }
    setDetailLoading(true);
    setProduct(undefined);

    const controller = new AbortController();
    nexaProductRepository
      .findDetailByPid(id, apiLocale, controller.signal)
      .then((raw) => {
        if (!controller.signal.aborted) {
          setProduct(mapNexaProductDetail(raw));
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error("[ProductDetail] Error fetching detail:", err);
          setProduct(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [id, apiLocale, currencyCode]);

  const backTo: string = (location.state as any)?.from || "/";
  /** Use browser history back when the user came from within the app,
   *  so React Router's ScrollRestoration kicks in and the product cache
   *  is kept intact.  Fall back to "/" for direct-URL access. */
  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { toggleFavorite, isFavorite } = useUser();
  const { isAuthenticated } = useAuth();
  const wishlist = product ? isFavorite(product.id) : false;
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [specsViewed, setSpecsViewed] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const MAX_VISIBLE_THUMBS = 6;

  const imageColRef = useRef<HTMLDivElement>(null);

  const variantAttrNames = useMemo(() => {
    if (!product) return [];
    const keys = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)));
    // Hide meaningless generic attribute names from single-variant / default products
    keys.delete("default");
    keys.delete("key");
    return Array.from(keys);
  }, [product]);

  // Auto-select the only variant when there are no meaningful attribute selectors
  useEffect(() => {
    if (!product) return;
    if (variantAttrNames.length === 0 && product.variants.length === 1) {
      const v = product.variants[0];
      setSelectedAttrs(v.attributes);
    }
  }, [product, variantAttrNames]);

  const selectedVariant = useMemo(() => {
    if (!product || !variantAttrNames.length) return null;
    return product.variants.find((v) =>
      variantAttrNames.every((k) => v.attributes[k] === selectedAttrs[k])
    ) ?? null;
  }, [product, variantAttrNames, selectedAttrs]);

  /**
   * Keep the active image in sync with the selected variant: when the user
   * picks a colour/size combination that has its own variant image, switch
   * the gallery to that image automatically.
   */
  useEffect(() => {
    if (!selectedVariant?.image || !product) return;
    const baseImages = product.images?.length ? product.images : [];
    const idx = baseImages.findIndex((img) => img.url === selectedVariant.image);
    if (idx >= 0) setActiveImage(idx);
  }, [selectedVariant, product]);

  const variantOptions = useMemo(() => {
    if (!product) return {} as Record<string, string[]>;
    const map: Record<string, string[]> = {};
    variantAttrNames.forEach((key) => {
      map[key] = [...new Set(product.variants.map((v) => v.attributes[key]).filter(Boolean))];
    });
    return map;
  }, [product, variantAttrNames]);

  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const displayStock = selectedVariant ? selectedVariant.stock_quantity : product?.stock ?? 0;

  // Compute price range from variant prices (or product-level priceMax)
  const priceRange = useMemo(() => {
    if (!product) return null;
    if (selectedVariant) return null; // exact price, no range
    const variantPrices = product.variants.map(v => v.price).filter(p => p > 0);
    if (variantPrices.length >= 2) {
      const mn = Math.min(...variantPrices);
      const mx = Math.max(...variantPrices);
      if (mn !== mx) return { min: mn, max: mx };
    }
    if (product.priceMax && product.priceMax !== product.price) {
      return { min: product.price, max: product.priceMax };
    }
    return null;
  }, [product, selectedVariant]);

  // Extract images from description HTML, merge with product images (deduplicated),
  // and produce a cleaned description without <img> tags.
  const { images, cleanDescription } = useMemo(() => {
    const baseImages = product?.images?.length
      ? [...product.images]
      : product ? [{ url: product.image, alt: product.name, position: 1 }] : [];

    if (!product?.description) {
      return { images: baseImages, cleanDescription: product?.description ?? "" };
    }

    // Parse description to extract <img> src URLs
    const parser = new DOMParser();
    const doc = parser.parseFromString(product.description, "text/html");
    const imgElements = doc.querySelectorAll("img");
    const seen = new Set(baseImages.map(img => img.url));
    const descImages: { url: string; alt: string; position: number }[] = [];

    imgElements.forEach((el) => {
      const src = el.getAttribute("src");
      if (src && !seen.has(src)) {
        seen.add(src);
        descImages.push({ url: src, alt: el.getAttribute("alt") || product.name, position: baseImages.length + descImages.length });
      }
      // Remove the <img> from the DOM tree
      el.remove();
    });

    const cleaned = doc.body.innerHTML;
    return { images: [...baseImages, ...descImages], cleanDescription: cleaned };
  }, [product]);

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!product) return;
    // Guard: if product has variants, require a full selection before adding
    if (variantAttrNames.length > 0 && !selectedVariant) {
      toast.error("Por favor selecciona todas las opciones (color, talla…)");
      return;
    }
    const options = selectedVariant
      ? { quantity, variantId: selectedVariant.id, selectedAttrs: { ...selectedAttrs } }
      : { quantity };
    addToCart({ ...product, price: displayPrice, stock: displayStock }, options);
    const attrLabel = Object.entries(selectedAttrs)
      .filter(([, v]) => v)
      .map(([, v]) => v)
      .join(" · ");
    toast.success(
      `${quantity} × ${product.name}${attrLabel ? ` — ${attrLabel}` : ""} agregado al carrito`
    );
  };

  const relatedProducts = product
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const hasSpecs = (product?.attributes?.length ?? 0) > 0;

  // Review stats from product data
  const reviewStats = useMemo(() => {
    if (!product) return { avgRating: 0, count: 0 };
    return { avgRating: product.rating ?? 0, count: product.reviews ?? 0 };
  }, [product]);

  // ── Loading state ─────────────────────────────────────────
  if (detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gray-200 mx-auto mb-4 animate-spin" strokeWidth={1.5} />
          <h2 className="text-xl text-gray-900 mb-2">Cargando producto...</h2>
          <p className="text-sm text-gray-400 mb-6">Obteniendo los detalles del producto, esto puede tardar unos segundos.</p>
          <button onClick={goBack} className="text-sm text-gray-700 bg-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-300 transition-colors">
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  }

  // ── Not found state ───────────────────────────────────────
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-sm text-gray-400 mb-6">El producto que buscas no existe o fue eliminado.</p>
          <button onClick={goBack} className="text-sm text-gray-700 bg-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-300 transition-colors">
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 flex-wrap">
          <Link to="/" className="hover:text-blue-700 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
          <Link to={`/store/${product.category.toLowerCase()}`} className="hover:text-blue-700 transition-colors">{product.category}</Link>
          {product.subcategory && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
              <span className="text-gray-500">{product.subcategory}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
          <span className="text-gray-700 truncate max-w-[260px]">{product.name}</span>
        </nav>

        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Volver
        </button>

        {/* ───────── Amazon-style 3-col layout ───────── */}
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(280px,3fr)] gap-6 mb-10">

          {/* ─── COL 1 — GALLERY ─── */}
          <div className="order-1" ref={imageColRef}>
            <div className="flex gap-3">
              {/* Vertical thumbnails (desktop) */}
              {images.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                  {images.slice(0, MAX_VISIBLE_THUMBS).map((img, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setActiveImage(i)}
                      onClick={() => setActiveImage(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border transition-all bg-white ${activeImage === i
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-gray-200 hover:border-gray-400"}`}
                    >
                      <img src={img.url} alt={img.alt} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                  {images.length > MAX_VISIBLE_THUMBS && (
                    <button
                      onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
                      className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center"
                      title="Ver galería"
                    >
                      <span className="text-[11px] font-semibold text-gray-600">+{images.length - MAX_VISIBLE_THUMBS}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main image */}
              <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discount > 0 && (
                    <span className="inline-flex items-center h-6 px-2 text-[11px] font-semibold bg-red-500 text-white rounded">
                      -{discount}%
                    </span>
                  )}
                  {product.featured && (
                    <span className="inline-flex items-center h-6 px-2 text-[11px] bg-gray-900 text-white rounded">
                      Destacado
                    </span>
                  )}
                </div>

                <button
                  onClick={() => { setGalleryIndex(activeImage); setShowGallery(true); }}
                  className="relative aspect-square w-full bg-white cursor-zoom-in group"
                >
                  <img
                    src={images[activeImage]?.url ?? product.image}
                    alt={images[activeImage]?.alt ?? product.name}
                    className="w-full h-full object-contain p-6 transition-all duration-300 group-hover:scale-[1.03]"
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
                      {activeImage + 1}/{images.length}
                    </div>
                  )}
                </button>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-sm hover:bg-white transition-all flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700 rotate-180" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setActiveImage(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-sm hover:bg-white transition-all flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Horizontal thumbnail strip (mobile only) */}
            {images.length > 1 && (
              <div className="sm:hidden mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, MAX_VISIBLE_THUMBS).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border transition-all bg-white ${activeImage === i ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-200"}`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust row — under the gallery */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {TRUST_BADGES.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2.5 py-2"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-800 leading-tight truncate">{title}</p>
                    <p className="text-[9px] text-gray-400 leading-tight truncate">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── COL 2 — PRODUCT INFO ─── */}
          <div className="order-2 min-w-0">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl text-gray-900 tracking-tight leading-snug mb-2">
              {product.name}
            </h1>

            {/* Brand chip + category */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.brand && (
                <span className="inline-flex items-center text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {product.brand}
                </span>
              )}
              <span className="text-[11px] text-gray-500">{product.category}</span>
              {product.subcategory && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] text-gray-500">{product.subcategory}</span>
                </>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-900">{reviewStats.avgRating.toFixed(1)}</span>
              <Stars value={reviewStats.avgRating} size="md" />
              <a href="#reviews" className="text-xs text-blue-700 hover:underline">
                {reviewStats.count} {reviewStats.count === 1 ? "reseña" : "reseñas"}
              </a>
              {product.sku && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] text-gray-500 font-mono">SKU: {product.sku}</span>
                </>
              )}
            </div>

            {/* Price block (large) */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                {priceRange ? (
                  <span className="text-3xl text-gray-900 tracking-tight">
                    {formatPrice(priceRange.min)}
                    <span className="text-xl text-gray-400 mx-2">–</span>
                    {formatPrice(priceRange.max)}
                  </span>
                ) : (
                  <span className="text-3xl text-gray-900 tracking-tight">{formatPrice(displayPrice)}</span>
                )}
                {!priceRange && product.originalPrice && product.originalPrice > displayPrice && (
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
              {!priceRange && discount > 0 && product.originalPrice && (
                <p className="text-sm text-green-700 mt-1">
                  Ahorras {formatPrice(product.originalPrice - displayPrice)} ({discount}% de descuento)
                </p>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4 pb-4 border-b border-gray-100">
                {product.shortDescription}
              </p>
            )}

            {/* Variant selectors */}
            {variantAttrNames.length > 0 && (
              <div className="space-y-4 mb-4 pb-4 border-b border-gray-100">
                {variantAttrNames.map((attrName) => (
                  <div key={attrName}>
                    <p className="text-xs text-gray-700 mb-2">
                      <span className="uppercase tracking-wider text-[10px] text-gray-400">{attrName}</span>
                      {selectedAttrs[attrName] && (
                        <span className="ml-2 text-gray-900">{selectedAttrs[attrName]}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions[attrName]?.map((val) => {
                        const isSelected = selectedAttrs[attrName] === val;
                        const hasStock = product.variants.some((v) => {
                          const matchThis = v.attributes[attrName] === val;
                          const matchOthers = variantAttrNames
                            .filter((k) => k !== attrName)
                            .every((k) => !selectedAttrs[k] || v.attributes[k] === selectedAttrs[k]);
                          return matchThis && matchOthers && v.stock_quantity > 0;
                        });
                        const isColorAttr = attrName.toLowerCase() === "color";

                        if (isColorAttr) {
                          const bg = resolveColor(val);
                          return (
                            <div key={val} className="relative group">
                              <button
                                onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attrName]: val }))}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected
                                  ? "border-blue-600 scale-110 shadow-md"
                                  : "border-gray-200 hover:border-gray-400 hover:scale-105"} ${!hasStock ? "opacity-40" : ""}`}
                                style={{ background: bg }}
                                title={val}
                              />
                            </div>
                          );
                        }

                        return (
                          <button
                            key={val}
                            onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attrName]: val }))}
                            className={`h-9 px-3.5 text-sm rounded-lg border transition-all ${isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"} ${!hasStock ? "opacity-40 line-through" : ""}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Spec preview (first 5 attributes) */}
            {hasSpecs && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-700 uppercase tracking-wider">Detalles del producto</p>
                  <button
                    onClick={() => { setShowSpecsModal(true); setSpecsViewed(true); }}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    Ver todo <ChevronRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {product.attributes.slice(0, 6).map((attr, i) => (
                    <div key={i} className="flex items-baseline gap-2 text-xs">
                      <dt className="text-gray-500 flex-shrink-0">{attr.name}:</dt>
                      <dd className="text-gray-900 truncate">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* ─── COL 3 — BUY BOX (sticky) ─── */}
          <div className="order-3">
            <div className="lg:sticky lg:top-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

                {/* Price summary */}
                <div className="mb-4">
                  {priceRange ? (
                    <div className="text-2xl text-gray-900 tracking-tight">
                      {formatPrice(priceRange.min)} – {formatPrice(priceRange.max)}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl text-gray-900 tracking-tight">{formatPrice(displayPrice)}</span>
                      {product.originalPrice && product.originalPrice > displayPrice && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2 mb-3">
                  {displayStock > 0 ? (
                    <>
                      <span className="inline-flex w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-700">
                        {displayStock < 10 ? `¡Solo quedan ${displayStock}!` : "En stock"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-red-600">Sin stock</span>
                    </>
                  )}
                </div>

                {/* Shipping info */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 mb-4 space-y-1.5">
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Truck className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span>Envío <span className="text-gray-900 capitalize">{product.shippingClass}</span> disponible</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span>Devolución gratuita en 30 días</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Shield className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span>Garantía oficial del fabricante</span>
                  </div>
                </div>

                {/* Qty selector */}
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-gray-600">Cantidad</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <span className="w-10 text-center text-sm text-gray-900 tabular-nums">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                      disabled={quantity >= displayStock}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Primary CTA — dark, matches the rest of the storefront */}
                <button
                  onClick={handleAddToCart}
                  disabled={displayStock === 0}
                  className="w-full h-11 bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mb-2 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                  Agregar al carrito
                </button>

                {/* Secondary CTA — outline variant of the primary */}
                <button
                  onClick={() => { handleAddToCart(); if (displayStock > 0) navigate("/cart"); }}
                  disabled={displayStock === 0}
                  className="w-full h-11 bg-white hover:bg-gray-900 border border-gray-900 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900 hover:text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  Comprar ahora
                </button>

                {/* Wishlist & compare row */}
                <div className="flex items-center justify-center gap-4 text-xs">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) { toast.error("Inicia sesión para agregar favoritos"); return; }
                      if (product) toggleFavorite(product.id);
                    }}
                    className={`flex items-center gap-1.5 transition-colors ${wishlist ? "text-red-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlist ? "fill-red-500 text-red-500" : ""}`} strokeWidth={1.5} />
                    {wishlist ? "Favorito" : "Añadir a favoritos"}
                  </button>
                </div>

                {/* Safe-purchase strip */}
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed flex items-start gap-1.5">
                    <Shield className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    Compra segura: tus datos y pago están protegidos durante toda la transacción.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>{/* /main grid */}

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10">
          <h2 className="text-sm text-gray-900 mb-3 tracking-tight">Descripción</h2>
          <div
            className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanDescription) }}
          />
          {product.keywords?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.keywords.map((kw, i) => (
                <span key={i} className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">{kw}</span>
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl text-gray-900 tracking-tight mb-6">También te puede interesar</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <div id="reviews" />
        <ReviewsSection
          productId={product.id}
          baseRating={product.rating}
          baseCount={product.reviews}
          productName={product.name}
          productCategory={product.category}
        />

      </div>

      {/* Specs modal */}
      {showSpecsModal && hasSpecs && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSpecsModal(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50/80 border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gray-300 rounded-full" />
                <div>
                  <h2 className="text-sm text-gray-700 tracking-tight">Ficha técnica</h2>
                  <p className="text-[10px] text-gray-400 truncate max-w-[360px] mt-0.5">{product.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 bg-gray-200/60 px-2.5 py-1 rounded-full">
                  {product.attributes.length} specs
                </span>
                <button
                  onClick={() => setShowSpecsModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-all rounded-lg"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              className="overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {product.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className={`group flex items-stretch min-h-[52px] transition-colors hover:bg-gray-50/80 ${Math.floor(i / 2) % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      } ${i < product.attributes.length - 2 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-gray-200 to-gray-100 group-hover:from-gray-400 group-hover:to-gray-200 transition-colors" />
                    <div className="flex flex-col justify-center px-4 py-3 flex-1 min-w-0">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none mb-1">{attr.name}</p>
                      <p className="text-xs text-gray-800 leading-snug">{attr.value}</p>
                    </div>
                    <div className="flex items-start pt-3 pr-3">
                      <span className="text-[9px] text-gray-300 tabular-nums">{String(i + 1).padStart(2, "00")}</span>
                    </div>
                  </div>
                ))}
                {product.attributes.length % 2 !== 0 && (
                  <div className="bg-gray-50/40" />
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-gray-400">
                Mostrando {product.attributes.length} de {product.attributes.length} especificaciones
              </span>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="text-[10px] text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Gallery / Lightbox modal ──────────────────────────── */}
      {showGallery && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col" onClick={() => setShowGallery(false)}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-white/70 text-sm">
              {galleryIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setShowGallery(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" strokeWidth={1.5} />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center relative px-4 min-h-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white rotate-180" strokeWidth={1.5} />
            </button>

            <img
              src={images[galleryIndex]?.url}
              alt={images[galleryIndex]?.alt}
              className="max-h-[70vh] max-w-full object-contain rounded-lg select-none"
            />

            <button
              onClick={() => setGalleryIndex(i => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" strokeWidth={1.5} />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex-shrink-0 px-4 py-3 overflow-x-auto" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2 justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${galleryIndex === i
                    ? "border-white shadow-lg scale-105"
                    : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-contain bg-white/10 p-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}