import { Truck, Shield, CreditCard } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function InfoBanner() {
  const { t } = useLanguage();

  const items = [
    { icon: Truck, text: t("banner.freeShipping"), highlight: t("banner.freeShipping.amount") },
    { icon: Shield, text: t("banner.secureBuy") },
    { icon: CreditCard, text: t("banner.multiPayment") },
  ];

  /* Duplicate the list so the marquee loops seamlessly */
  const doubled = [...items, ...items];

  return (
    <div className="bg-white border-b border-gray-200 overflow-hidden">
      <div
        className="flex animate-marquee whitespace-nowrap py-2.5"
        /* pause on hover */
        style={{ ["--marquee-speed" as string]: "22s" }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {doubled.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-sm text-gray-700 mx-8 sm:mx-12 flex-shrink-0"
            >
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
              <span>
                {item.text}
                {item.highlight && <span className="font-medium ml-1">{item.highlight}</span>}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}