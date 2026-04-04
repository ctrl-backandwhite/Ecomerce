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
  store: () => "/store",
  category: (name: string) => `/store/${slugify(name)}`,
  subcategory: (catName: string, subName: string) =>
    `/store/${slugify(catName)}/${slugify(subName)}`,
  product: (id: string | number) => `/product/${id}`,
  search: (query: string) => `/search/${encodeURIComponent(query.trim())}`,
  brand: (slug: string) => `/brand/${slug}`,
  cart: () => "/cart",
  checkout: () => "/checkout",
};
