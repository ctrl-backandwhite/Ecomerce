import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { slideRepository, type Slide } from "../repositories/SlideRepository";

import { logger } from "../lib/logger";

/* ── Filter params each promo CTA applies ─────────────────── */
export type PromoFilter = Record<string, string>;

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  buttonText: string;
  filterParams: PromoFilter;
  image: string;
  align: "left" | "right";
}

/* ── Map API slide → UI promo ─────────────────────────────── */
function slideToPromo(s: Slide, index: number): Promo {
  const colors = [
    "bg-white/20 text-white border-white/30",
    "bg-rose-500/80 text-white border-rose-400/50",
    "bg-violet-500/80 text-white border-violet-400/50",
    "bg-amber-500/80 text-white border-amber-400/50",
    "bg-emerald-500/80 text-white border-emerald-400/50",
    "bg-sky-500/80 text-white border-sky-400/50",
  ];
  /* parse link as filterParams, e.g. "/?ofertas=true&category=Moda" */
  const params: PromoFilter = {};
  if (s.link) {
    try {
      const search = s.link.includes("?") ? s.link.split("?")[1] : "";
      new URLSearchParams(search).forEach((v, k) => { params[k] = v; });
    } catch (err) { logger.warn("Suppressed error", err); }
  }
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle ?? "",
    description: "",
    badge: "",
    badgeColor: colors[index % colors.length],
    buttonText: s.buttonText ?? "Ver más",
    filterParams: params,
    image: s.imageUrl,
    align: index % 2 === 0 ? "left" : "right",
  };
}

/* ── Fallback static promos (used when API has no active slides) ── */
const fallbackPromos: Promo[] = [
  {
    id: "fallback-1",
    title: "Descubre los Mejores Productos",
    subtitle: "Tecnología de vanguardia",
    description:
      "Ofertas exclusivas con garantía de satisfacción y envío gratis en tu primera compra.",
    badge: "Nuevo",
    badgeColor: "bg-white/20 text-white border-white/30",
    buttonText: "Ver Ofertas",
    filterParams: { ofertas: "true" },
    image:
      "https://images.unsplash.com/photo-1738520420654-87cd2ad005d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHRlY2hub2xvZ3klMjBtb2Rlcm4lMjBnYWRnZXRzfGVufDF8fHx8MTc3MzMxMjk4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    align: "left",
  },
  {
    id: "fallback-2",
    title: "Hasta 50% OFF",
    subtitle: "Moda & Tendencias",
    description:
      "Las últimas tendencias de moda con descuentos increíbles. Stock limitado.",
    badge: "Oferta",
    badgeColor: "bg-rose-500/80 text-white border-rose-400/50",
    buttonText: "Ver Ofertas de Moda",
    filterParams: { category: "Moda", ofertas: "true" },
    image:
      "https://images.unsplash.com/photo-1771435416537-fdad7cbf4ef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBzYWxlJTIwZGlzY291bnQlMjBzaG9wcGluZ3xlbnwxfHx8fDE3NzMzMTI5ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    align: "right",
  },
  {
    id: "fallback-3",
    title: "Gaming al Siguiente Nivel",
    subtitle: "Setups Épicos",
    description:
      "Consolas, periféricos y accesorios para dominar cada partida.",
    badge: "Destacado",
    badgeColor: "bg-violet-500/80 text-white border-violet-400/50",
    buttonText: "Explorar Gaming",
    filterParams: { category: "Gaming" },
    image:
      "https://images.unsplash.com/photo-1771014817844-327a14245bd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBzZXR1cCUyMHJnYiUyMG5lb24lMjBkYXJrfGVufDF8fHx8MTc3MzMxMjk4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    align: "left",
  },
  {
    id: "fallback-4",
    title: "Electrónica de Alta Gama",
    subtitle: "Innovación sin límites",
    description:
      "Los mejores smartphones, laptops y gadgets con descuentos especiales para miembros NX036.",
    badge: "Exclusivo",
    badgeColor: "bg-amber-500/80 text-white border-amber-400/50",
    buttonText: "Ver Electrónica",
    filterParams: { category: "Electrónica", ofertas: "true" },
    image:
      "https://images.unsplash.com/photo-1759588071814-1ba7c5761af4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwc3R1ZGlvfGVufDF8fHx8MTc3MzMxNzYxOHww&ixlib=rb-4.1.0&q=80&w=1080",
    align: "right",
  },
];

const TRANSITION_MS = 900;

interface PromoSliderProps {
  onCtaClick: (params: PromoFilter) => void;
}

export function PromoSlider({ onCtaClick }: PromoSliderProps) {
  const [promos, setPromos] = useState<Promo[]>(fallbackPromos);
  const [current, setCurrent] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const locked = useRef(false);

  /* ── Load active slides from API ── */
  useEffect(() => {
    let cancelled = false;
    slideRepository
      .findActive()
      .then((slides) => {
        if (!cancelled && slides.length > 0) {
          setPromos(slides.map(slideToPromo));
          setCurrent(0);
        }
      })
      .catch(() => {
        /* keep fallback promos on error */
      });
    return () => { cancelled = true; };
  }, []);

  const goTo = useCallback((index: number) => {
    if (locked.current) return;
    locked.current = true;

    setContentVisible(false);

    setTimeout(() => {
      setCurrent((index + promos.length) % promos.length);
      setTimeout(() => {
        setContentVisible(true);
        locked.current = false;
      }, 200);
    }, 250);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 10000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full overflow-hidden h-64 sm:h-80 md:h-[420px] lg:h-[580px]">

      {/* ── All slides stacked – true crossfade ── */}
      {promos.map((promo, i) => (
        <div
          key={promo.id}
          aria-hidden={i !== current}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${promo.image})`,
            opacity: i === current ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* ── Gradient overlay ── */}
      {promos.map((promo, i) => {
        const isRight = promo.align === "right";
        return (
          <div
            key={`overlay-${promo.id}`}
            aria-hidden
            className={`absolute inset-0 ${isRight
              ? "bg-gradient-to-l from-black/80 via-black/55 to-black/10"
              : "bg-gradient-to-r from-black/80 via-black/55 to-black/10"
              }`}
            style={{
              opacity: i === current ? 1 : 0,
              transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              zIndex: i === current ? 2 : 0,
            }}
          />
        );
      })}

      {/* ── Content ── */}
      <div
        className="relative h-full max-w-7xl mx-auto px-14 sm:px-12 lg:px-16 flex items-center"
        style={{
          zIndex: 10,
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 400ms ease, transform 400ms ease",
        }}
      >
        {(() => {
          const promo = promos[current];
          const isRight = promo.align === "right";
          return (
            <div className={`max-w-xl w-full mx-auto sm:mx-0 text-center sm:text-left ${isRight ? "sm:ml-auto sm:text-right" : ""}`}>
              {/* Badge — hidden on mobile to avoid overlapping counter */}
              <span className={`hidden sm:inline-block px-3 py-1 mb-4 text-xs tracking-widest uppercase backdrop-blur-sm border rounded-full ${promo.badgeColor}`}>
                {promo.badge}
              </span>

              {/* Subtitle */}
              <p className="hidden sm:block text-white/70 text-sm tracking-widest uppercase mb-2">
                {promo.subtitle}
              </p>

              {/* Title */}
              <h1 className="text-2xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-3 sm:mb-4">
                {promo.title}
              </h1>

              {/* Description */}
              <p className="hidden sm:block text-white/75 text-base sm:text-lg mb-8 leading-relaxed">
                {promo.description}
              </p>

              {/* CTA */}
              <button
                type="button"
                onClick={() => onCtaClick(promo.filterParams)}
                className="inline-flex items-center gap-2.5 px-4 py-2 sm:px-7 sm:py-3.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 active:scale-95 transition-all text-xs sm:text-sm tracking-wide"
              >
                {promo.buttonText}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Filter preview chips — hidden on mobile to avoid overlapping dots */}
              <div className={`hidden sm:flex mt-4 items-center gap-2 flex-wrap justify-center ${isRight ? "sm:justify-end" : "sm:justify-start"}`}>
                {Object.entries(promo.filterParams).map(([key, val]) => (
                  <span
                    key={key}
                    className="text-[11px] px-2.5 py-1 bg-white/15 text-white/80 border border-white/20 rounded-full backdrop-blur-sm"
                  >
                    {key === "ofertas" ? "Con descuento" : val}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Prev / Next ── */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors"
        style={{ zIndex: 20 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Siguiente"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors"
        style={{ zIndex: 20 }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ── Dots ── */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5"
        style={{ zIndex: 20 }}
      >
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir a slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === current
              ? "w-8 bg-white"
              : "w-2 bg-white/40 hover:bg-white/70"
              }`}
          />
        ))}
      </div>

      {/* ── Counter — hidden on mobile to avoid overlapping badge ── */}
      <div
        className="hidden sm:block absolute top-6 right-6 text-white/60 text-xs tracking-widest"
        style={{ zIndex: 20 }}
      >
        {String(current + 1).padStart(2, "0")} /{" "}
        {String(promos.length).padStart(2, "0")}
      </div>
    </div>
  );
}