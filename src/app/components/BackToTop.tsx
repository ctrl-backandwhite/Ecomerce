import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Floating "back to top" pill that fades in once the user has scrolled past
 * a few viewports. Clicking it smooth-scrolls the window to the top so a
 * shopper deep into the infinite product grid can jump back to the hero /
 * filters without manually dragging the scrollbar for 30k rows.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label={t("home.backToTop") || "Volver al inicio"}
      title={t("home.backToTop") || "Volver al inicio"}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-gray-900 text-white shadow-lg hover:bg-black transition-all duration-200 text-sm"
    >
      <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
      <span className="hidden sm:inline">{t("home.backToTop") || "Volver al inicio"}</span>
    </button>
  );
}
