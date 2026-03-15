import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { categoryTree } from "../data/products";
import { ArrowRight, Tag, Layers } from "lucide-react";
import { useStore } from "../context/StoreContext";

const categoryMeta: Record<string, { description: string; promo: string }> = {
  "Electrónica":  { description: "Smartphones, laptops, tablets y accesorios de última generación.",  promo: "Hasta 23% de descuento en seleccionados" },
  "Moda":         { description: "Ropa, calzado y complementos para cada estilo y ocasión.",           promo: "Nueva colección primavera disponible" },
  "Hogar":        { description: "Decoración, cocina y todo para hacer tu casa perfecta.",             promo: "Envío gratis en pedidos superiores a $50" },
  "Audio":        { description: "Auriculares, altavoces y micrófonos de alta fidelidad.",             promo: "Sonido premium al mejor precio" },
  "Gaming":       { description: "Consolas, videojuegos y periféricos para jugadores exigentes.",      promo: "Stock limitado — ¡no te lo pierdas!" },
  "Fotografía":   { description: "Cámaras, lentes y accesorios para el fotógrafo profesional.",        promo: "Equipamiento profesional disponible" },
  "Wearables":    { description: "Smartwatches, fitness bands y tecnología ponible inteligente.",       promo: "Monitoriza tu salud cada día" },
  "Accesorios":   { description: "Mochilas, gafas, carteras y complementos de diseño funcional.",      promo: "Diseño funcional desde $45" },
};

export function CategoryBar() {
  const { products } = useStore();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  function getSubcategoryCount(subcategory: string) {
    return products.filter((p) => p.subcategory === subcategory).length;
  }

  /* ── hover helpers ──────────────────────────────────────────── */
  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 160);
  };
  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };
  const handleMouseEnter = (name: string) => {
    cancelClose();
    setOpenCategory(name);
  };

  /* ── navigation helpers ─────────────────────────────────────── */
  const scrollToProducts = () =>
    setTimeout(() => {
      document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

  const goToCategory = (category: string) => {
    setOpenCategory(null);
    navigate(`/?category=${encodeURIComponent(category)}`);
    scrollToProducts();
  };

  const goToSubcategory = (category: string, subcategory: string) => {
    setOpenCategory(null);
    navigate(`/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    scrollToProducts();
  };

  const openCat = categoryTree.find((c) => c.name === openCategory);
  const meta    = openCategory ? categoryMeta[openCategory] : null;

  return (
    <nav
      className="sticky top-16 z-40 bg-white border-b border-gray-100"
      onMouseLeave={scheduleClose}
    >
      {/* ── Category tabs ─────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <ul className="flex items-stretch overflow-x-auto scrollbar-none divide-x divide-gray-100">
          {categoryTree.map(({ name, icon: Icon }) => {
            const isActive  = activeCategory === name;
            const isHovered = openCategory === name;
            return (
              <li key={name} className="flex-shrink-0 lg:flex-1">
                <button
                  onMouseEnter={() => handleMouseEnter(name)}
                  onClick={() => goToCategory(name)}
                  className={`w-full flex flex-col items-center gap-1.5 px-3 sm:px-5 py-3.5 text-xs tracking-wide transition-all border-b-2 ${
                    isActive || isHovered
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive || isHovered ? "text-gray-900" : "text-gray-400"
                    }`}
                    strokeWidth={1.5}
                  />
                  <span className="whitespace-nowrap">{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Mega menu panel ───────────────────────────────────── */}
      {openCat && meta && (
        <div
          className="absolute top-full left-0 right-0 bg-white border-t border-b border-gray-100 shadow-xl z-50"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="w-full px-6 lg:px-10 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-10">

              {/* Left: Category overview */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <openCat.icon className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[13px] text-gray-900">{openCategory}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Categoría</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">{meta.description}</p>
                <button
                  onClick={() => goToCategory(openCategory!)}
                  className="mt-auto inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors w-fit"
                >
                  Ver todo en {openCategory}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
                  <Tag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <span>{meta.promo}</span>
                </div>
              </div>

              {/* Middle: Subcategories */}
              <div>
                <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Subcategorías
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {openCat.subcategories.map((sub) => {
                    const count = getSubcategoryCount(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => goToSubcategory(openCategory!, sub)}
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-all"
                      >
                        <span className="text-[13px] text-gray-500 group-hover:text-gray-900 transition-colors">{sub}</span>
                        <span className="text-[10px] text-gray-300 group-hover:text-gray-400 transition-colors ml-2 flex-shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Visual card — mismo estilo que panel admin */}
              <div className="hidden lg:flex flex-col bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Destacado</p>
                <h4 className="text-[13px] text-gray-900 mt-3 mb-1">Tendencias en {openCategory}</h4>
                <p className="text-xs text-gray-500 leading-relaxed flex-1">
                  Descubre los productos más valorados y con mayor demanda de la categoría.
                </p>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{products.filter((p) => p.category === openCategory).length} productos</span>
                    <button
                      onClick={() => goToCategory(openCategory!)}
                      className="flex items-center gap-1 text-gray-900 hover:underline"
                    >
                      Ver todos <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}