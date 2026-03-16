/**
 * IProductRepository — contract for product data access.
 *
 * Any class that fulfils this interface can be used as the product
 * data source; the rest of the app never depends on the concrete
 * implementation (supplier API, REST backend, mock, etc.).
 */

import type { Product } from "../data/products";

// ─────────────────────────────────────────────────────────────────────────────
// Query / result types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductQuery {
  /** CJ category ID (overrides `category` for API calls). */
  categoryId?: string;
  /** Free-text keyword search. */
  search?: string;
  /** Minimum sell price (inclusive). */
  minPrice?: number;
  /** Maximum sell price (inclusive). */
  maxPrice?: number;
  /** 1-based page number. */
  page?: number;
  /** Items per page. */
  limit?: number;
  /** Sort order applied server-side. */
  orderBy?: "PRICE_ASC" | "PRICE_DESC" | "CREATED_AT";
}

export interface ProductPage {
  /** Products on the current page, already mapped to the domain model. */
  items: Product[];
  /** Total matching products across all pages. */
  total: number;
  /** Page that was fetched (1-based). */
  page: number;
  /** Actual page size used by the API. */
  pageSize: number;
  /** Whether more pages are available. */
  hasMore: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IProductRepository {
  /**
   * Returns a page of products matching the given query.
   * Implementations should apply caching where appropriate.
   */
  findMany(query?: ProductQuery): Promise<ProductPage>;

  /**
   * Returns a single product by its unique ID (CJ PID), including
   * full variant, attribute, and description data.
   * Returns `null` if the product does not exist.
   */
  findById(id: string): Promise<Product | null>;
}