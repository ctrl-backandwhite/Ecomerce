/**
 * Centralized URL builder for NX036 e-commerce.
 * Single source of truth for all route patterns.
 */

/** Convert any text to a URL-safe slug (removes accents, lowercase, hyphenated) */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const urls = {
  home: () => "/",
  store: () => "/tienda",
  category: (name: string) => `/tienda/${slugify(name)}`,
  subcategory: (catName: string, subName: string) =>
    `/tienda/${slugify(catName)}/${slugify(subName)}`,
  product: (id: string | number) => `/producto/${id}`,
  search: (query: string) => `/buscar/${encodeURIComponent(query.trim())}`,
  brand: (slug: string) => `/marca/${slug}`,
  cart: () => "/carrito",
  checkout: () => "/checkout",
};
