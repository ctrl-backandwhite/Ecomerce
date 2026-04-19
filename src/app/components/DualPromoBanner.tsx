import { Link } from "react-router";
import { ArrowRight, Sparkles, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Pair of contrasting promo cards (eBay-style): a dark CTA for new-user
 * registration and a warm CTA for the newsletter. Shown only to anonymous
 * visitors — once authenticated these tiles are noise.
 */
export function DualPromoBanner() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-4">

        {/* Dark card — sign-up */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-7 sm:p-9 text-white flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/15 rounded-full text-[10px] tracking-widest uppercase text-white/70 mb-4">
              <Sparkles className="w-3 h-3" strokeWidth={1.5} />
              Nuevos usuarios
            </div>
            <h3 className="text-2xl sm:text-3xl tracking-tight mb-2 leading-tight">
              10% de descuento en tu primera compra
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-5 max-w-sm">
              Crea tu cuenta gratis, recibe ofertas personalizadas y envío preferente en cada pedido.
            </p>
          </div>
          <div className="relative">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm rounded-full px-5 py-2.5 hover:bg-gray-100 transition-colors"
            >
              Crear cuenta
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Warm card — newsletter */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-7 sm:p-9 text-white flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/10" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 border border-white/20 rounded-full text-[10px] tracking-widest uppercase text-white/90 mb-4">
              <Mail className="w-3 h-3" strokeWidth={1.5} />
              Newsletter
            </div>
            <h3 className="text-2xl sm:text-3xl tracking-tight mb-2 leading-tight">
              Las mejores ofertas, directas al inbox
            </h3>
            <p className="text-sm text-white/85 leading-relaxed mb-5 max-w-sm">
              Entérate antes que nadie de descuentos flash, lanzamientos y cupones exclusivos.
            </p>
          </div>
          <div className="relative">
            <Link
              to="/newsletter"
              className="inline-flex items-center gap-2 bg-white text-orange-600 text-sm rounded-full px-5 py-2.5 hover:bg-white/90 transition-colors"
            >
              Suscribirme
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
