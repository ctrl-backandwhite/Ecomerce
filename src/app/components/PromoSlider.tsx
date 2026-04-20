import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { slideRepository, type Slide } from "../repositories/SlideRepository";
import { useLanguage } from "../context/LanguageContext";

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
function slideToPromo(s: Slide, index: number, t: (key: string) => string): Promo {
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
    buttonText: s.buttonText ?? t("slide.default.btn"),
    filterParams: params,
    image: s.imageUrl,
    align: index % 2 === 0 ? "left" : "right",
  };
}

const TRANSITION_MS = 900;

interface PromoSliderProps {
  onCtaClick: (params: PromoFilter) => void;
}

export function PromoSlider({ onCtaClick }: PromoSliderProps) {
  const { t, locale } = useLanguage();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [current, setCurrent] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const locked = useRef(false);

  /* ── Load active slides from API (refetch on locale change) ── */
  useEffect(() => {
    let cancelled = false;
    slideRepository
      .findActive(locale)
      .then((slides) => {
        if (!cancelled && slides.length > 0) {
          setPromos(slides.map((s, i) => slideToPromo(s, i, t)));
          setCurrent(0);
        }
      })
      .catch(() => { /* no slides available */ });
    return () => { cancelled = true; };
  }, [t, locale]);

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
  }, [promos.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 10000);
    return () => clearInterval(timer);
  }, [next]);

  /* No active slides → hide slider entirely */
  if (promos.length === 0) return null;

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
                    {key === "ofertas" ? t("slide.chip.discount") : val}
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
        aria-label={t("slide.prev")}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors"
        style={{ zIndex: 20 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label={t("slide.next")}
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
            aria-label={`${t("slide.goTo")} ${i + 1}`}
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