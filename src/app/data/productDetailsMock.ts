/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  productDetailsMock — Fallback detail data for CORS-blocked      ║
 * ║  environments.                                                    ║
 * ║                                                                   ║
 * ║  Sources (all added to MOCK_DETAIL_MAP at module load):          ║
 * ║  • womens-hoodie-product-data.json  — wrapped in { products:[] } ║
 * ║  • mens-hoodie-details.json         — bare array content         ║
 * ║  • product-info.json                — bare array content         ║
 * ║  • product-details.json             — bare array content         ║
 * ║                                                                   ║
 * ║  For catalog products NOT covered by the batch files,            ║
 * ║  synthesizeDetail() generates plausible Color × Size variants    ║
 * ║  from the thin catalog entry (name, price, sku, image).          ║
 * ║  getMockDetail() is the unified lookup that callers should use.  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import womensRaw     from "../../imports/pasted_text/womens-hoodie-product-data.json?raw";
import mensRaw       from "../../imports/pasted_text/mens-hoodie-details.json?raw";
import productInfoRaw    from "../../imports/pasted_text/product-info.json?raw";
import productDetailsRaw from "../../imports/pasted_text/product-details.json?raw";
import type { Product, ProductImage, ProductVariant, ProductAttribute } from "./products";

// ─────────────────────────────────────────────────────────────────────────────
// JSON repair helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Remove trailing commas before } or ] (handles both standard and JSON5). */
function stripTrailingCommas(s: string): string {
  return s.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Extracts the array of `{ pid, response: { result, data } }` entries from
 * a raw text file that may be in one of two shapes:
 *
 *   A) Wrapped object  : `{ ..., "products": [ {...}, ... ] }`
 *      (womens-hoodie-product-data.json — may be truncated at the end)
 *
 *   B) Bare array body : `    { pid... },\n    { pid... },`
 *      (mens-hoodie-details.json — missing outer [ ] and trailing comma)
 *
 * Returns [] on any unrecoverable parse failure.
 */
function loadEntries(rawText: string): any[] {
  const trimmed = rawText.trim();
  const clean   = stripTrailingCommas;

  // ── Strategy A: try the text as a complete / closeable JSON value ──────────
  const wrappedClosings = ["", "\n  ]\n}", "\n]}", "\n  ]\n  }\n}"];
  for (const tail of wrappedClosings) {
    try {
      const parsed = JSON.parse(clean(trimmed + tail));
      if (Array.isArray(parsed))          return parsed;           // already an array
      if (Array.isArray(parsed?.products)) return parsed.products; // { products: [...] }
    } catch { /* try next */ }
  }

  // ── Strategy B: bare array body — wrap in [ ... ] then repair ─────────────
  const arrayClosings = ["", "\n]", "\n  ]"];
  for (const tail of arrayClosings) {
    try {
      const parsed = JSON.parse(clean(`[\n${trimmed}${tail}\n]`));
      if (Array.isArray(parsed)) return parsed;
    } catch { /* try next */ }
  }

  console.warn("[productDetailsMock] Could not parse file — returning empty list.");
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a CJ batch variantKey string into a typed attribute map.
 *
 * Supported formats (in priority order):
 *   1. "Color-Size"               → { Color, Size }     e.g. "Black-L"
 *   2. "Color Name-Size"          → { Color, Size }     e.g. "Color 1 White Leaves-S"
 *   3. "Style-Size-Piece"         → { Style, Size, Piece } e.g. "Style1-2XL-Pants"
 *   4. "Code-Size"                → { Style, Size }     e.g. "ZZXC350-M"
 *   5. Fallback                   → { Variante: raw }
 *
 * Sizes recognised (longest-first to avoid "L" swallowing "XL"):
 *   6XL, 5XL, 4XL, 3XL, XXL, XXXL, XL, L, M, S, XS, XXS, 2XL
 */
const SIZES = [
  "XXXL", "6XL", "5XL", "4XL", "3XL", "XXL", "2XL", "XL", "L", "M", "S", "XS", "XXS",
] as const;

function parseVariantKey(key: string | null | undefined): Record<string, string> {
  if (!key) return {};

  const parts = key.split("-");

  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim();

    // Last segment is a known garment size
    if ((SIZES as readonly string[]).includes(last)) {
      const rest = parts.slice(0, -1).join("-").trim();

      // Three segments: Style-Size-Piece  (e.g. "Style1-2XL-Tops")
      // Wait — that can't happen if we already stripped size from the end…
      // Actually the "Piece" comes AFTER size in the raw key: "Style1-2XL-Tops"
      // In this case `last` = "Tops" (not a size), so it won't match here.
      // "Style1-2XL-Pants" → last = "Pants" → not a size → falls through to below.

      return { Color: rest, Size: last };
    }

    // Last segment is a piece type (Tops / Pants / etc.) and second-to-last is a size
    if (parts.length >= 3) {
      const piece  = parts[parts.length - 1].trim();
      const size   = parts[parts.length - 2].trim();
      const style  = parts.slice(0, -2).join("-").trim();

      if ((SIZES as readonly string[]).includes(size)) {
        return { Style: style, Size: size, Piece: piece };
      }
    }

    // Generic: everything before last dash → Color, last → Variant
    const color   = parts.slice(0, -1).join("-").trim();
    const variant = last;
    return { Color: color, Size: variant };
  }

  // Single segment — might just be a size
  if ((SIZES as readonly string[]).includes(key)) return { Size: key };

  return { Variante: key };
}

/** Parses a CJ weight string (range like "422.00-522.00") → grams (midpoint). */
function parseWeightGrams(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  const parts = String(raw)
    .split("-")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  if (parts.length === 0) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

/** Parses a CJ sell-price string (single or "min--max" / "min-max") → minimum. */
function parsePriceRange(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  const parts = String(raw)
    .split(/--|-/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  return parts.length > 0 ? Math.min(...parts) : 0;
}

/** Strips HTML tags from a CJ description string into readable plain text. */
function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Core mapper
// ─────────────────────────────────────────────────────────────────────────────

function mapBatchProduct(raw: Record<string, any>): Product {
  // ── Variants ──────────────────────────────────────────────────────────────
  const variants: ProductVariant[] = (raw.variants ?? []).map((v: any): ProductVariant => ({
    id:             v.vid,
    sku:            v.variantSku ?? "",
    price:          v.variantSellPrice ?? 0,
    stock_quantity: 100, // batch data has no real per-variant stock
    attributes:     parseVariantKey(v.variantKey ?? v.variantNameEn),
  }));

  // ── Image gallery (deduplicated) ──────────────────────────────────────────
  const seenUrls = new Set<string>();
  const images: ProductImage[] = [];

  const rawImgs: (string | undefined | null)[] = [
    raw.bigImage,
    ...(raw.productImageSet ?? []),
    ...(raw.variants ?? []).map((v: any) => v.variantImage as string | null),
  ];

  rawImgs.forEach((url) => {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      images.push({
        url,
        alt:      `${raw.productNameEn} — imagen ${images.length + 1}`,
        position: images.length,
      });
    }
  });

  // ── Attribute summary ─────────────────────────────────────────────────────
  const attrKeys = new Set<string>();
  variants.forEach((v) => Object.keys(v.attributes).forEach((k) => attrKeys.add(k)));

  const attributes: ProductAttribute[] = Array.from(attrKeys).map((name) => ({
    name,
    value: [...new Set(variants.map((v) => v.attributes[name]).filter(Boolean))].join(", "),
  }));

  // Extra product-level specs
  const weightG = parseWeightGrams(raw.productWeight);
  if (weightG > 0)
    attributes.push({ name: "Peso", value: `${Math.round(weightG)} g` });
  if (raw.productSku)
    attributes.push({ name: "SKU Proveedor", value: raw.productSku });
  if ((raw.materialNameEnSet ?? []).length > 0)
    attributes.push({ name: "Material", value: (raw.materialNameEnSet as string[]).join(", ") });
  if ((raw.packingNameEnSet ?? []).length > 0)
    attributes.push({ name: "Embalaje", value: (raw.packingNameEnSet as string[]).join(", ") });
  if (raw.entryNameEn)
    attributes.push({ name: "Tipo de producto", value: raw.entryNameEn });
  if (raw.categoryName)
    attributes.push({ name: "Categoría CJ", value: raw.categoryName });

  // ── Derived values ────────────────────────────────────────────────────────
  const price       = parsePriceRange(raw.sellPrice);
  const totalStock  = variants.length > 0 ? variants.length * 100 : 999;
  const description = stripHtml(raw.description);

  const categoryParts = (raw.categoryName ?? "").split(/[/>]/).map((s: string) => s.trim()).filter(Boolean);
  const categoryLeaf  = categoryParts[categoryParts.length - 1] || "Dropshipping";
  const categoryRoot  = categoryParts[0] || "Dropshipping";

  return {
    id:               raw.pid,
    name:             raw.productNameEn,
    slug:             raw.pid,
    sku:              raw.productSku ?? `CJ-${String(raw.pid).slice(0, 8)}`,
    brand:            "NEXA",
    description,
    shortDescription: categoryLeaf,
    price,
    taxClass:         "standard",
    category:         categoryRoot,       // ← nombre legible (ej. "Men's Clothing"), no UUID
    subcategory:      categoryLeaf,       // ← hoja (ej. "Man Hoodies & Sweatshirts")
    keywords:         [],
    image:            raw.bigImage ?? "",
    images,
    rating:           0,
    reviews:          0,
    stock:            totalStock,
    barcode:          "",
    stockStatus:      "in_stock",
    manageStock:      variants.length > 0,
    allowBackorder:   false,
    attributes,
    variants,
    weight:           weightG / 1000, // g → kg
    dimensions:       { length: 30, width: 20, height: 3 },
    shippingClass:    "standard",
    metaTitle:        raw.productNameEn,
    metaDescription:  categoryLeaf,
    status:           "active",
    visibility:       "public",
    featured:         false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loader — processes one file's entries into the map
// ─────────────────────────────────────────────────────────────────────────────

function loadFileIntoMap(rawText: string, label: string, map: Map<string, Product>): void {
  let added = 0;
  let failed = 0;
  try {
    const entries = loadEntries(rawText);
    for (const entry of entries) {
      const data = entry?.response?.data;
      if (!data || entry?.response?.result !== true) continue;
      try {
        const product = mapBatchProduct(data);
        map.set(product.id, product);
        added++;
      } catch (e) {
        failed++;
        console.warn(`[productDetailsMock] ${label} — failed to map pid ${entry?.pid}:`, e);
      }
    }
    console.info(`[productDetailsMock] ${label} → ${added} products loaded${failed ? `, ${failed} skipped` : ""}.`);
  } catch (e) {
    console.warn(`[productDetailsMock] ${label} — could not load file:`, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export — pre-parsed at module load (runs once)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Map<pid, Product> of all successfully fetched products from all batch
 * detail JSON files.  Keyed by CJ pid so the repository can do O(1) lookups.
 */
export const MOCK_DETAIL_MAP: Map<string, Product> = (() => {
  const map = new Map<string, Product>();
  loadFileIntoMap(womensRaw,          "womens-hoodie-product-data.json", map);
  loadFileIntoMap(mensRaw,            "mens-hoodie-details.json",        map);
  loadFileIntoMap(productInfoRaw,     "product-info.json",               map);
  loadFileIntoMap(productDetailsRaw,  "product-details.json",            map);
  console.info(`[productDetailsMock] Total: ${map.size} products available as mock fallback.`);
  return map;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic detail enricher
// ─────────────────────────────────────────────────────────────────────────────

const ADULT_SIZES   = ["S", "M", "L", "XL", "2XL"] as const;
const KIDS_SIZES    = ["110", "120", "130", "140", "150", "160"] as const;
const FREE_SIZE_ARR = ["Free Size"] as const;

const WOMEN_COLORS  = ["Black", "White", "Grey", "Pink", "Navy Blue", "Beige"];
const MEN_COLORS    = ["Black", "White", "Grey", "Navy Blue", "Dark Green", "Khaki"];
const UNISEX_COLORS = ["Black", "White", "Grey", "Navy Blue", "Red", "Green"];

/** Deterministic stable int — avoids Math.random() so variants are stable across renders. */
function deterministicInt(seed: string, min: number, max: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) ^ seed.charCodeAt(i);
  return min + (Math.abs(h) % (max - min + 1));
}

/** Pull explicit color names out of an English product name. */
function extractNameColors(name: string): string[] {
  // Order matters: longer phrases must come before their substrings
  const COLOR_MAP: [string, string][] = [
    ["camouflage", "Camouflage"], ["camo", "Camouflage"],
    ["navy blue",  "Navy Blue"],  ["navy", "Navy Blue"],
    ["dark green", "Dark Green"], ["light blue", "Light Blue"],
    ["light grey", "Light Grey"],
    ["multicolor", "Multicolor"], ["multi-color", "Multicolor"],
    ["black", "Black"], ["white", "White"], ["red", "Red"],
    ["blue",  "Blue"],  ["green", "Green"], ["grey", "Grey"],
    ["gray",  "Grey"],  ["pink",  "Pink"],  ["yellow", "Yellow"],
    ["orange", "Orange"], ["purple", "Purple"], ["brown", "Brown"],
    ["khaki",  "Khaki"],  ["beige", "Beige"],  ["cream",  "Cream"],
    ["gold",   "Gold"],   ["golden", "Gold"],
  ];
  const lower = name.toLowerCase();
  const found: string[] = [];
  for (const [kw, color] of COLOR_MAP) {
    if (lower.includes(kw) && !found.includes(color)) found.push(color);
  }
  return found;
}

/**
 * Returns true for design/print products where the "color" IS the design —
 * these only carry size variants (no separate Color axis).
 */
function isDesignBased(name: string): boolean {
  const l = name.toLowerCase();
  return (
    l.includes("3d ") || l.includes(" 3d") ||
    l.includes("photo embroidery") ||
    l.includes("gradient coloring") || l.includes("gradient colour") ||
    l.includes("halloween") || l.includes("pumpkin") ||
    l.includes("graffiti") ||
    l.includes("christmas") ||
    l.includes("sequined") ||
    // "printed" alone is too broad; only when it's a defining feature
    l.includes("3d print")
  );
}

/** Returns true for accessories that use a single "Free Size". */
function isAccessory(name: string, sku: string): boolean {
  const l = name.toLowerCase();
  return (
    l.includes(" hat") || l.includes("hat ") ||
    l.includes("scarf") ||
    l.includes("earflap") ||
    l.includes("gloves") ||
    l.includes("shawl") ||
    sku.toUpperCase().startsWith("CJBQ")
  );
}

/**
 * Generates realistic Color × Size (or Size-only) variants for a catalog product
 * that has no batch-detail entry.  Uses only data already available in the thin
 * Product object (name, price, sku, image).
 */
export function synthesizeDetail(p: Product): Product {
  const name  = p.name;
  const lower = name.toLowerCase();

  const isKids   = /boys|girls|children|kids?\b/.test(lower);
  const isWomen  = /women|girl|female/.test(lower);
  const isMen    = /\bmen'?s?\b|male|\bboy\b/.test(lower);
  const acc      = isAccessory(name, p.sku);
  const designFx = isDesignBased(name);

  // ── Sizes ────────────────────────────────────────────────────────────────
  const sizes: string[] = acc
    ? [...FREE_SIZE_ARR]
    : isKids
    ? [...KIDS_SIZES]
    : [...ADULT_SIZES];

  // ── Colors ───────────────────────────────────────────────────────────────
  let colors: string[];
  if (designFx || acc) {
    // Design-based or accessory: no Color axis — size selector only
    colors = [];
  } else {
    const nameColors = extractNameColors(name);
    if (nameColors.length >= 2) {
      colors = nameColors.slice(0, 5);
    } else if (nameColors.length === 1) {
      const base = nameColors[0];
      const pool = isWomen ? WOMEN_COLORS : isMen ? MEN_COLORS : UNISEX_COLORS;
      colors = [base, ...pool.filter((c) => c !== base)].slice(0, 4);
    } else {
      const pool = isWomen ? WOMEN_COLORS : isMen ? MEN_COLORS : UNISEX_COLORS;
      colors = pool.slice(0, 4);
    }
  }

  // ── Variant grid ─────────────────────────────────────────────────────────
  const variants: ProductVariant[] = [];
  const basePrice = p.price > 0 ? p.price : 9.99;

  if (colors.length === 0) {
    // Size-only
    sizes.forEach((size, si) => {
      const price = Math.round(basePrice * (1 + si * 0.04) * 100) / 100;
      variants.push({
        id:             `${p.id}-v${si}`,
        sku:            `${p.sku}-${size}`,
        price,
        stock_quantity: deterministicInt(`${p.id}-${si}`, 80, 500),
        attributes:     { Size: size },
      });
    });
  } else {
    // Color × Size
    colors.forEach((color, ci) => {
      sizes.forEach((size, si) => {
        const price = Math.round(basePrice * (1 + si * 0.03) * 100) / 100;
        variants.push({
          id:             `${p.id}-v${ci}-${si}`,
          sku:            `${p.sku}-${color.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${size}`,
          price,
          stock_quantity: deterministicInt(`${p.id}-${ci}-${si}`, 50, 400),
          attributes:     { Color: color, Size: size },
        });
      });
    });
  }

  // ── Attribute summary ─────────────────────────────────────────────────────
  const attributes: ProductAttribute[] = [];
  if (colors.length > 0)
    attributes.push({ name: "Color", value: colors.join(", ") });
  attributes.push({ name: "Talla", value: sizes.join(", ") });
  if (p.sku)
    attributes.push({ name: "SKU Proveedor", value: p.sku });
  if (p.category)
    attributes.push({ name: "Categoría", value: p.category });

  return {
    ...p,
    variants,
    attributes,
    manageStock:  true,
    stock:        variants.reduce((s, v) => s + v.stock_quantity, 0),
    stockStatus:  "in_stock",
  };
}

/**
 * Unified detail lookup — the single entry point callers should use instead
 * of accessing MOCK_DETAIL_MAP directly.
 *
 * Priority:
 *   1. Real batch-API entry from MOCK_DETAIL_MAP (full images + real variants)
 *   2. synthesizeDetail(catalogProduct)  — generated from catalog thin entry
 *   3. null
 */
export function getMockDetail(
  id: string,
  catalogProduct?: Product | null,
): Product | null {
  const rich = MOCK_DETAIL_MAP.get(id);
  if (rich) return rich;
  if (catalogProduct) return synthesizeDetail(catalogProduct);
  return null;
}