import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router";
import { reviews as allReviews, type Review } from "../data/reviews";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  Star, ShoppingCart, Heart, Truck, Shield,
  ArrowLeft, Plus, Minus, ChevronRight, Package,
  RefreshCw, Award, Check, ThumbsUp, ChevronDown,
  MessageSquare, Pencil,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { toast } from "sonner";

// ── Stars helper ──────────────────────────────────────────────
function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= Math.floor(value)
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
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                helped
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
            className={`w-7 h-7 transition-colors ${
              i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-200"
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
  productId, baseRating, baseCount,
}: { productId: string; baseRating: number; baseCount: number }) {
  const [localReviews, setLocalReviews] = useState<Review[]>(
    allReviews.filter((r) => r.productId === productId)
  );
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [sort, setSort] = useState<"recent" | "helpful" | "rating_high" | "rating_low">("recent");
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newName, setNewName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const total = localReviews.length;
  const avgRating = total > 0
    ? localReviews.reduce((s, r) => s + r.rating, 0) / total
    : baseRating;
  const displayRating = Math.round(avgRating * 10) / 10;
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: localReviews.filter((r) => r.rating === s).length,
  }));

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
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );
  }

  function handleSubmit() {
    if (newRating === 0) { toast.error("Selecciona una valoración"); return; }
    if (!newTitle.trim()) { toast.error("Escribe un título para tu reseña"); return; }
    if (newBody.trim().length < 20) { toast.error("La reseña debe tener al menos 20 caracteres"); return; }
    if (!newName.trim()) { toast.error("Escribe tu nombre"); return; }

    const colors = [
      "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700",
      "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
      "bg-purple-100 text-purple-700", "bg-sky-100 text-sky-700",
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
    toast.success("¡Gracias por tu reseña!");
    setTimeout(() => { setShowForm(false); setSubmitted(false); }, 2000);
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
            className="flex items-center gap-1.5 text-xs text-white bg-gray-900 px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
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
                    className="text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors"
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
                className={`rounded-lg px-2 py-0.5 transition-colors text-left ${
                  filter === String(star) ? "bg-amber-50" : "hover:bg-gray-50"
                }`}
              >
                <RatingBar star={star} count={count} total={total} />
              </button>
            ))}
          </div>
        </div>

        {/* Filters + sort */}
        {total > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    filter === f
                      ? "border-gray-900 bg-gray-900 text-white"
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

// ── Main component ────────────────────────────────────────────
export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Destino del botón "Volver": usa el state.from si existe, si no va a home
  const backTo: string = (location.state as any)?.from || "/";

  const product = products.find((p) => p.id === id);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlist, setWishlist] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const variantAttrNames = useMemo(() => {
    if (!product) return [];
    const keys = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product || !variantAttrNames.length) return null;
    return product.variants.find((v) =>
      variantAttrNames.every((k) => v.attributes[k] === selectedAttrs[k])
    ) ?? null;
  }, [product, variantAttrNames, selectedAttrs]);

  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const displayStock = selectedVariant ? selectedVariant.stock_quantity : product?.stock ?? 0;
  const images = product?.images?.length
    ? product.images
    : product ? [{ url: product.image, alt: product.name, position: 1 }] : [];

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-sm text-gray-400 mb-6">El producto que buscas no existe o fue eliminado.</p>
          <button onClick={() => navigate("/")} className="text-sm text-white bg-gray-900 px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({ ...product, price: displayPrice, stock: displayStock });
    }
    toast.success(`${quantity} × ${product.name} agregado al carrito`);
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const variantOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    variantAttrNames.forEach((key) => {
      map[key] = [...new Set(product.variants.map((v) => v.attributes[key]).filter(Boolean))];
    });
    return map;
  }, [product, variantAttrNames]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
          <Link to="/" className="hover:text-gray-700 transition-colors">{product.category}</Link>
          <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
          {product.subcategory && (
            <>
              <span>{product.subcategory}</span>
              <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
            </>
          )}
          <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Volver
        </button>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-16 mb-16 lg:items-stretch">

          {/* Image Gallery */}
          <div className="flex flex-col gap-3 h-full">

            {/* ── Main image ── */}
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex-1 flex flex-col">
              <div className="flex-1 min-h-[320px] relative flex items-center justify-center p-6">
                <img
                  src={images[activeImage]?.url ?? product.image}
                  alt={images[activeImage]?.alt ?? product.name}
                  className="w-full h-full object-contain transition-all duration-300"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg">-{discount}%</span>
                  )}
                  {product.featured && (
                    <span className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" strokeWidth={0} />
                      Destacado
                    </span>
                  )}
                </div>
                {/* Wishlist */}
                <button
                  onClick={() => { setWishlist(!wishlist); toast.success(wishlist ? "Eliminado de favoritos" : "Agregado a favoritos"); }}
                  className="absolute top-4 right-4 w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-all"
                >
                  <Heart className={`w-5 h-5 ${wishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} strokeWidth={1.5} />
                </button>
                {/* Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {activeImage + 1}/{images.length}
                  </div>
                )}
                {/* Prev / Next arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setActiveImage(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Thumbnail carousel ── */}
            {images.length > 1 && (
              <div className="relative">
                <div
                  className="flex gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none" }}
                >
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 snap-start w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${
                        activeImage === i
                          ? "border-gray-900 shadow-sm scale-[1.05]"
                          : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Product Info */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              {product.brand && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{product.brand}</span>
              )}
              <span className="text-xs text-gray-400">{product.category}</span>
              {product.subcategory && (
                <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">{product.subcategory}</span></>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl text-gray-900 tracking-tight mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-5">
              <Stars value={product.rating} size="md" />
              <span className="text-sm text-gray-900">{product.rating}</span>
              <span className="text-sm text-gray-400">({product.reviews} reseñas)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-4xl text-gray-900 tracking-tight">${displayPrice.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > displayPrice && (
                <span className="text-xl text-gray-400 line-through">${product.originalPrice.toLocaleString()}</span>
              )}
              {discount > 0 && (
                <span className="text-sm text-red-500">Ahorras ${(product.originalPrice! - displayPrice).toLocaleString()}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">{product.shortDescription}</p>
            )}

            <div className="mb-5">
              {displayStock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-700">
                    En stock{displayStock < 10 && ` · ¡Solo quedan ${displayStock}!`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600">Sin stock</span>
                </div>
              )}
            </div>

            {/* Variant selectors */}
            {variantAttrNames.map((attrName) => (
              <div key={attrName} className="mb-5">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
                  {attrName}
                  {selectedAttrs[attrName] && (
                    <span className="text-gray-700 ml-2 normal-case tracking-normal">{selectedAttrs[attrName]}</span>
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
                    const colorMap: Record<string, string> = {
                      "Titanio Negro": "#1F1F1F", "Titanio Blanco": "#F0EDE6",
                      "Titanio Natural": "#C4A882", "Negro": "#111827",
                      "Blanco": "#F9FAFB", "Azul": "#3B82F6", "Rojo": "#EF4444",
                    };
                    const isColorAttr = attrName.toLowerCase() === "color";
                    const bgColor = colorMap[val];
                    if (isColorAttr && bgColor) {
                      return (
                        <button
                          key={val}
                          onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attrName]: val }))}
                          title={val}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"} ${!hasStock ? "opacity-40" : ""}`}
                          style={{ backgroundColor: bgColor }}
                        />
                      );
                    }
                    return (
                      <button
                        key={val}
                        onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attrName]: val }))}
                        className={`px-4 py-2 text-xs rounded-xl border transition-all ${isSelected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"} ${!hasStock ? "opacity-40 line-through" : ""}`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity + cart */}
            <div className="flex gap-3 mb-6">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <span className="w-10 text-center text-sm text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} disabled={quantity >= displayStock} className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={displayStock === 0}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-white bg-gray-900 rounded-xl px-5 py-3 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                {displayStock === 0 ? "Sin stock" : "Agregar al carrito"}
              </button>
              <button
                onClick={() => { setWishlist(!wishlist); toast.success(wishlist ? "Eliminado de favoritos" : "Agregado a favoritos"); }}
                className={`w-12 h-11 border rounded-xl flex items-center justify-center transition-all ${wishlist ? "border-red-200 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <Heart className={`w-4 h-4 ${wishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} strokeWidth={1.5} />
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-auto border-t border-gray-100 pt-5 space-y-3">
              {[
                { icon: Truck,     title: "Envío gratis",          sub: "En compras superiores a $100" },
                { icon: Shield,    title: "Garantía de 1 año",     sub: "Protección total del producto" },
                { icon: RefreshCw, title: "Devoluciones gratuitas",sub: "30 días para devolver" },
                { icon: Award,     title: "Producto oficial",      sub: "Distribuidor autorizado" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-900">{title}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description + Specs */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base text-gray-900 mb-4 tracking-tight">Descripción</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            {product.keywords?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {product.keywords.map((kw, i) => (
                  <span key={i} className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">{kw}</span>
                ))}
              </div>
            )}
          </div>
          {product.attributes?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base text-gray-900 mb-4 tracking-tight">Especificaciones</h2>
              {product.attributes.map((attr, i) => (
                <div key={i} className={`flex items-start gap-4 py-3 ${i < product.attributes.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-center gap-2 w-36 flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-xs text-gray-400">{attr.name}</span>
                  </div>
                  <span className="text-xs text-gray-900">{attr.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping info */}
        {(product.weight > 0 || product.sku) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-16">
            <h2 className="text-base text-gray-900 mb-4 tracking-tight">Información de envío</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {product.sku && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">SKU</p>
                  <p className="text-xs text-gray-900 font-mono">{product.sku}</p>
                </div>
              )}
              {product.weight > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Peso</p>
                  <p className="text-xs text-gray-900">{product.weight} kg</p>
                </div>
              )}
              {(product.dimensions.length > 0 || product.dimensions.width > 0) && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Dimensiones</p>
                  <p className="text-xs text-gray-900">{product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height} cm</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Envío</p>
                <p className="text-xs text-gray-900 capitalize">{product.shippingClass}</p>
              </div>
            </div>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl text-gray-900 tracking-tight mb-6">También te puede interesar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <ReviewsSection
          productId={product.id}
          baseRating={product.rating}
          baseCount={product.reviews}
        />

      </div>
    </div>
  );
}