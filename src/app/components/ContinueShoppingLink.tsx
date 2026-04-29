import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import { urls } from "../lib/urls";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  // Filled, used as a CTA on confirmation screens.
  primary:
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors",
  // Bordered, fits next to other secondary actions (cart sidebar, checkout
  // success page header).
  secondary:
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors",
  // Text-only, used as a breadcrumb / lightweight link inside a header.
  ghost:
    "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors",
};

export interface ContinueShoppingLinkProps {
  variant?: Variant;
  className?: string;
  /** Override the default "/store" destination if a flow needs it. */
  to?: string;
  /** Override the i18n label — fallback for breadcrumb-style usages that
   *  prefer "Volver a la tienda" over "Seguir comprando". */
  labelKey?: string;
}

/**
 * Unified "back to shop / keep shopping" link used across:
 *   - cart sidebar + empty state
 *   - checkout success
 *   - account / favorites breadcrumbs
 *   - compare and gift-card pages
 *
 * Always points to /store and prepends an ArrowLeft icon so the buyer has
 * one consistent visual cue to leave the current flow and return to
 * browsing products. i18n labels live under `common.continueShopping`.
 */
export function ContinueShoppingLink({
  variant = "secondary",
  className = "",
  to,
  labelKey = "common.continueShopping",
}: ContinueShoppingLinkProps) {
  const { t } = useLanguage();
  return (
    <Link to={to ?? urls.store()} className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}>
      <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
      {t(labelKey)}
    </Link>
  );
}
