import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Clock, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "../context/CartContext";
import { useFlashDeals } from "../hooks/useFlashDeals";
import { toast } from "sonner";

/* ── Countdown helpers ────────────────────────────────────── */
function getSecondsUntil(target: Date | null): number {
  if (!target) {
    // Fallback: midnight today
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  }
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
}

function formatCountdown(secs: number) {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return {
    d: d > 0 ? String(d) : null,
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

/* ── Props ────────────────────────────────────────────────── */
interface FlashDealsProps {
  onVerOfertas: () => void;
}

/* ── Component ────────────────────────────────────────────── */
export function FlashDeals({ onVerOfertas }: FlashDealsProps) {
  const { deals, loading, endDate } = useFlashDeals();
  const { addToCart } = useCart();
  const [secs, setSecs] = useState(() => getSecondsUntil(endDate));
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Sync countdown target when endDate resolves */
  useEffect(() => {
    setSecs(getSecondsUntil(endDate));
  }, [endDate]);

  /* countdown tick */
  useEffect(() => {
    const id = setInterval(
      () => setSecs((s) => (s > 0 ? s - 1 : getSecondsUntil(endDate))),
      1000,
    );
    return () => clearInterval(id);
  }, [endDate]);

  const time = formatCountdown(secs);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  }, []);

  if (loading || deals.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 border border-red-100">
              <Zap className="w-4 h-4 text-red-500" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Ofertas Flash</h2>
              <p className="text-xs text-gray-400 mt-0.5">Descuentos exclusivos por tiempo limitado</p>
            </div>

            {/* Countdown */}
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-gray-100">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-[11px] text-gray-400 mr-1">Termina en</span>
              {time.d && (
                <span className="flex flex-col items-center">
                  <span className="tabular-nums text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 min-w-[32px] text-center">
                    {time.d}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">D</span>
                </span>
              )}
              {([time.h, time.m, time.s] as const).map((val, i) => (
                <span key={i} className="flex flex-col items-center">
                  <span className="tabular-nums text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 min-w-[32px] text-center">
                    {val}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    {i === 0 ? "H" : i === 1 ? "M" : "S"}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onVerOfertas}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Horizontal scroll strip ── */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {deals.map((p) => (
            <div
              key={p.id}
              className="flex-shrink-0 w-[200px] bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Image */}
              <Link
                to={`/product/${p.id}`}
                className="block relative aspect-square bg-gray-50 overflow-hidden"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Discount badge */}
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] px-1.5 py-0.5 rounded-md tabular-nums">
                  {p.campaignBadge || `-${p.pct}%`}
                </span>
                {/* Stock warning */}
                {p.stock < 15 && (
                  <span className="absolute bottom-2 right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                    ¡Últimas!
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-3">
                <Link to={`/product/${p.id}`}>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5 truncate">
                    {p.brand}
                  </p>
                  <p className="text-xs text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
                    {p.name}
                  </p>
                </Link>

                {/* Prices */}
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-base text-gray-900">${p.price}</span>
                  <span className="text-xs text-gray-400 line-through">${p.originalPrice}</span>
                </div>

                {/* Stock bar */}
                <div className="mb-2.5">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Quedan {p.stock}</span>
                    <span>{Math.min(100, Math.round((1 - p.stock / 150) * 100))}% vendido</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((1 - p.stock / 150) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Add to cart */}
                <button
                  onClick={() => { addToCart(p); toast.success("Añadido al carrito"); }}
                  className="w-full flex items-center justify-center gap-1.5 h-7 text-[11px] bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-3 h-3" /> Agregar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile "ver todas" */}
        <div className="sm:hidden mt-4 text-center">
          <button
            onClick={onVerOfertas}
            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Ver todas las ofertas <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </section>
  );
}
