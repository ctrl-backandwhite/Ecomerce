import { Truck, Shield, CreditCard, Headphones, RotateCcw, Award, Globe, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

export function InfoBanner() {
  const { t } = useLanguage();

  /* Each item links to a destination matching its message — product listings
   * for benefits that surface as filters (offers, deals, free-shipping
   * thresholds), or the relevant policy/info page for service guarantees
   * (returns, shipping, support, security, payments). */
  const items = [
    { icon: Truck, text: t("banner.freeShipping"), highlight: t("banner.freeShipping.amount"), to: "/store" },
    { icon: Shield, text: t("banner.secureBuy"), to: "/legal/privacidad" },
    { icon: CreditCard, text: t("banner.multiPayment"), to: "/faq" },
    { icon: Headphones, text: t("banner.support"), to: "/contact" },
    { icon: RotateCcw, text: t("banner.easyReturns"), to: "/legal/terminos" },
    { icon: Award, text: t("banner.bestPrice"), to: "/store" },
    { icon: Globe, text: t("banner.worldwide"), to: "/shipping" },
    { icon: Lock, text: t("banner.encrypted"), to: "/legal/privacidad" },
    { icon: Sparkles, text: t("banner.qualityGuarantee"), to: "/store" },
  ];

  /* The CSS keyframe slides 0 → -50%, so duplicating once gives a seamless
   * loop. With 9 distinct items the duplicated track is wide enough to cover
   * any reasonable viewport without visible gaps. */
  const looped = [...items, ...items];

  return (
    <div className="bg-white border-b border-gray-200 overflow-hidden">
      <div
        className="flex animate-marquee whitespace-nowrap py-2.5"
        /* pause on hover */
        style={{ ["--marquee-speed" as string]: "22s" }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {looped.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={i}
              to={item.to}
              className="inline-flex items-center gap-2 text-sm text-gray-700 mx-8 sm:mx-12 flex-shrink-0 hover:text-gray-900 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
              <span>
                {item.text}
                {item.highlight && <span className="font-medium ml-1">{item.highlight}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}