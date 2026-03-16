/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  reviewSynthesizer — Generador determinista de reseñas           ║
 * ║                                                                   ║
 * ║  Para productos sin reseñas estáticas en reviews.ts, genera      ║
 * ║  entre 3 y 4 reseñas verosímiles usando el ID del producto como  ║
 * ║  semilla (djb2 hash). Los resultados son siempre los mismos para  ║
 * ║  el mismo producto, sin aleatoriedad en tiempo de ejecución.      ║
 * ║                                                                   ║
 * ║  Uso: getProductReviews(product) → Review[]                       ║
 * ║  → Primero busca reviews estáticas; si no hay, sintetiza.         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import type { Review } from "./reviews";
import { reviews as staticReviews } from "./reviews";

// ─────────────────────────────────────────────────────────────────────────────
// djb2 hash — deterministic, no external deps
// ─────────────────────────────────────────────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash;
}

/** Picks an item from array deterministically based on a numeric seed. */
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Content pools
// ─────────────────────────────────────────────────────────────────────────────

const AUTHORS = [
  { name: "Laura M.",    avatar: "LM", color: "bg-rose-100 text-rose-700"    },
  { name: "Carlos B.",   avatar: "CB", color: "bg-sky-100 text-sky-700"      },
  { name: "Sofía R.",    avatar: "SR", color: "bg-fuchsia-100 text-fuchsia-700" },
  { name: "Miguel T.",   avatar: "MT", color: "bg-emerald-100 text-emerald-700" },
  { name: "Ana G.",      avatar: "AG", color: "bg-violet-100 text-violet-700"  },
  { name: "David P.",    avatar: "DP", color: "bg-amber-100 text-amber-700"   },
  { name: "Elena V.",    avatar: "EV", color: "bg-teal-100 text-teal-700"     },
  { name: "Pablo S.",    avatar: "PS", color: "bg-indigo-100 text-indigo-700" },
  { name: "Marta L.",    avatar: "ML", color: "bg-orange-100 text-orange-700" },
  { name: "Jorge A.",    avatar: "JA", color: "bg-cyan-100 text-cyan-700"     },
  { name: "Nuria F.",    avatar: "NF", color: "bg-lime-100 text-lime-700"     },
  { name: "Roberto C.",  avatar: "RC", color: "bg-blue-100 text-blue-700"     },
  { name: "Claudia H.",  avatar: "CH", color: "bg-pink-100 text-pink-700"     },
  { name: "Fernando N.", avatar: "FN", color: "bg-purple-100 text-purple-700" },
  { name: "Beatriz O.",  avatar: "BO", color: "bg-green-100 text-green-700"   },
  { name: "Tomás Q.",    avatar: "TQ", color: "bg-red-100 text-red-700"       },
];

const DATES = [
  "2026-01-10", "2026-01-18", "2026-01-24", "2026-01-30",
  "2026-02-05", "2026-02-11", "2026-02-17", "2026-02-23",
  "2026-03-01", "2026-03-06", "2026-03-10",
];

// Rating distribution: biased toward 4–5
const RATINGS = [5, 5, 5, 5, 4, 4, 4, 5, 4, 5, 3, 5, 4, 5, 4, 5];

// ─────────────────────────────────────────────────────────────────────────────
// Review templates by category keyword
// ─────────────────────────────────────────────────────────────────────────────

type TemplateSet = { title: string; body: string }[];

const CLOTHING_TEMPLATES: TemplateSet = [
  {
    title: "Calidad increíble para el precio",
    body: "Me sorprendió gratamente la calidad de la tela al recibirlo. Es suave, gruesa y con muy buen acabado en costuras. El color es exactamente como en las fotos. Lo lavé varias veces y no ha perdido forma ni color. Sin duda repetiría la compra.",
  },
  {
    title: "Muy cómodo para el día a día",
    body: "Lo uso casi a diario desde que llegó. La tela transpira bien y no pica. El diseño es bonito sin ser llamativo. Combina con prácticamente todo lo que tengo en el armario. El envío llegó antes de lo esperado y el embalaje protegía bien la prenda.",
  },
  {
    title: "Talla exacta, muy satisfecha",
    body: "Pedí mi talla habitual y quedó perfecto. Ni grande ni pequeño. El tejido es de calidad, no demasiado fino. Lo he llevado con vaqueros y con leggings y queda genial en ambos casos. Muy recomendable para quien busca comodidad sin sacrificar estética.",
  },
  {
    title: "Ideal para este invierno",
    body: "Abriga mucho más de lo que esperaba para su precio. El forro interior es suave y calienta bien. El bolsillo delantero es grande y práctico. Ya se lo he recomendado a dos amigas. Estoy muy contenta con la compra.",
  },
  {
    title: "Diseño que llama la atención",
    body: "Recibí varios comentarios el primer día que lo llevé puesto. El estampado tiene mucha personalidad y los colores son vivos pero no chillones. La confección es sólida: sin hilos sueltos ni descosidos. Un artículo que destaca y aguanta el uso.",
  },
  {
    title: "Producto tal cual en la foto",
    body: "Muchas veces los artículos online decepcionan en persona, pero este no. La fotografía es fiel al producto real. El material es agradable al tacto y no desprende olor a plástico ni a tinte. Se seca rápido después del lavado, lo cual se agradece.",
  },
  {
    title: "Perfecto para el gimnasio",
    body: "Lo uso para entrenar y es ideal: ligero, elástico en los movimientos y absorbe bien el sudor. Después del lavado queda como nuevo. El precio es muy competitivo para la calidad que ofrece. Lo he comprado en dos colores distintos.",
  },
  {
    title: "Regalo acertado",
    body: "Lo compré para regalar y a quien lo recibió le encantó. La presentación era cuidada y el producto llegó doblado y limpio. La calidad supera lo que cabría esperar por el precio. Sin duda es una compra que vale la pena.",
  },
  {
    title: "Comodidad para todo el día",
    body: "Trabajo desde casa y me lo pongo prácticamente todos los días en invierno. Es lo suficientemente informal para estar en casa pero también presentable para videollamadas. El tejido no se arruga fácilmente. Un básico que no puede faltar.",
  },
  {
    title: "Muy buen acabado para su precio",
    body: "Comparado con otras prendas de precio similar, este tiene mejor acabado en costuras y una tela más gruesa. Los colores son fieles a las fotos. Tras varios lavados mantiene la forma. Una compra muy recomendable.",
  },
];

const ELECTRONICS_TEMPLATES: TemplateSet = [
  {
    title: "Relación calidad-precio imbatible",
    body: "Funciona exactamente como se describe. La instalación fue sencilla y en menos de 10 minutos ya estaba funcionando. Después de varios meses de uso sigo igual de satisfecho. Los materiales son sólidos y el diseño es discreto y funcional.",
  },
  {
    title: "Supera las expectativas",
    body: "No esperaba tanta calidad por este precio. El producto llega bien embalado, los accesorios incluidos son útiles y las instrucciones están claras. El rendimiento en uso diario es estable y sin fallos. Totalmente recomendable.",
  },
  {
    title: "Fiable y duradero",
    body: "Llevo meses usándolo a diario y no ha dado ningún problema. La build quality se siente premium. La respuesta es rápida y precisa. Comparado con otros productos del mercado en el mismo rango de precio, este está claramente por encima.",
  },
  {
    title: "Exactamente lo que buscaba",
    body: "Llevaba tiempo buscando algo así y por fin lo encontré. Cumple todas las funciones descritas sin complicaciones. La conectividad es estable y la batería dura lo que promete. Muy satisfecho con la compra.",
  },
];

const GENERIC_TEMPLATES: TemplateSet = [
  {
    title: "Producto de calidad",
    body: "El producto llega en perfecto estado, bien embalado y en el plazo indicado. La calidad supera el precio. Lo recomiendo sin dudarlo a cualquiera que esté buscando algo en esta categoría. Nada que reprochar.",
  },
  {
    title: "Muy satisfecho con la compra",
    body: "Cumple con lo prometido sin sorpresas desagradables. La relación calidad-precio es muy buena. El acabado es sólido y no tiene defectos visibles. Ya he repetido la compra en otro color.",
  },
  {
    title: "Como se describe, sin engaños",
    body: "Las fotos son fieles a la realidad. El producto tiene buen tacto y construcción sólida. Nada se cae ni chirría. Llegó antes de lo esperado. Es exactamente lo que buscaba y puedo recomendarlo sin reservas.",
  },
  {
    title: "Buena opción en su precio",
    body: "No es el artículo más caro del mercado, pero cumple muy bien su función. La durabilidad está siendo buena — llevo meses usando lo a diario sin deterioro visible. Perfecto para quien quiera buena calidad sin gastar de más.",
  },
];

function getTemplates(name: string, category: string): TemplateSet {
  const combined = `${name} ${category}`.toLowerCase();
  if (/hoodie|sweater|sweatshirt|hoodie|top|jacket|suit|dress|shirt|vest|cardigan|pullover/i.test(combined)) {
    return CLOTHING_TEMPLATES;
  }
  if (/electronic|phone|laptop|tablet|camera|audio|watch|gaming|console|mouse|keyboard/i.test(combined)) {
    return ELECTRONICS_TEMPLATES;
  }
  return GENERIC_TEMPLATES;
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthesizer
// ─────────────────────────────────────────────────────────────────────────────

function synthesizeReviews(productId: string, productName: string, category: string): Review[] {
  const seed0 = djb2(productId);
  const templates = getTemplates(productName, category);
  const count = 3 + (seed0 % 2); // 3 or 4 reviews

  const used = new Set<number>();
  const result: Review[] = [];

  for (let i = 0; i < count; i++) {
    const s = djb2(`${productId}-${i}`);

    // Pick a unique template index
    let tIdx = s % templates.length;
    let safety = 0;
    while (used.has(tIdx) && safety < 20) { tIdx = (tIdx + 1) % templates.length; safety++; }
    used.add(tIdx);

    const author  = pick(AUTHORS, djb2(`${productId}-author-${i}`));
    const rating  = pick(RATINGS, djb2(`${productId}-rating-${i}`));
    const date    = pick(DATES,   djb2(`${productId}-date-${i}`));
    const helpful = 5 + (djb2(`${productId}-helpful-${i}`) % 55);
    const verified = (djb2(`${productId}-ver-${i}`) % 3) !== 0; // 66% verified

    result.push({
      id:          `synth-${productId}-${i}`,
      productId,
      author:      author.name,
      avatar:      author.avatar,
      avatarColor: author.color,
      rating,
      title:       templates[tIdx].title,
      body:        templates[tIdx].body,
      date,
      verified,
      helpful,
    });
  }

  // Sort by helpful desc (most useful first)
  return result.sort((a, b) => b.helpful - a.helpful);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the reviews for a product.
 * - If static reviews exist in reviews.ts → returns those.
 * - Otherwise → synthesizes deterministic reviews from the product data.
 */
export function getProductReviews(
  productId: string,
  productName = "",
  category = "",
): Review[] {
  const found = staticReviews.filter((r) => r.productId === productId);
  if (found.length > 0) return found;
  return synthesizeReviews(productId, productName, category);
}

/**
 * Returns the single best review (highest rating + most helpful) for display
 * in product cards and pull-quotes.
 */
export function getBestReview(
  productId: string,
  productName = "",
  category = "",
): Review | null {
  const all = getProductReviews(productId, productName, category);
  if (!all.length) return null;
  return [...all].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.helpful - a.helpful;
  })[0];
}

/**
 * Computes average rating and review count from synthesized (or static) reviews.
 * Use this to replace product.rating / product.reviews in UI components.
 */
export function getReviewStats(
  productId: string,
  productName = "",
  category = "",
): { avgRating: number; count: number } {
  const all = getProductReviews(productId, productName, category);
  if (!all.length) return { avgRating: 0, count: 0 };
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  return {
    avgRating: Math.round(avg * 10) / 10,
    count: all.length,
  };
}