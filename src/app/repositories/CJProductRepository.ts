/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CJProductRepository                                         ║
 * ║                                                              ║
 * ║  Concrete IProductRepository backed by the CJ Dropshipping  ║
 * ║  REST API.                                                   ║
 * ║                                                              ║
 * ║  Caching strategy:                                           ║
 * ║  • List pages  : 3-minute TTL (catalog changes slowly)       ║
 * ║  • Detail       : 10-minute TTL (includes variants/images)   ║
 * ║  • Cache key for pages: stringified ProductQuery             ║
 * ║  • Cache key for detail: product PID                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { listCJProducts, getCJProductDetail } from "../services/cjApi";
import { cjMapper }                           from "../mappers/cjMapper";
import { TTLCache }                           from "../lib/cache";
import { toAppError }                         from "../lib/AppError";
import type { IProductRepository, ProductQuery, ProductPage } from "./IProductRepository";
import type { Product } from "../data/products";

const PAGE_TTL_MS   = 3  * 60_000;  // 3 minutes
const DETAIL_TTL_MS = 10 * 60_000;  // 10 minutes

class CJProductRepository implements IProductRepository {
  private readonly pageCache   = new TTLCache<ProductPage>();
  private readonly detailCache = new TTLCache<Product>();

  // ── Helpers ──────────────────────────────────────────────────────────────

  private cacheKey(query: ProductQuery): string {
    // Stable JSON key — sort keys so { a:1, b:2 } and { b:2, a:1 } share one entry
    const sorted = Object.fromEntries(
      Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    return JSON.stringify(sorted);
  }

  // ── IProductRepository ────────────────────────────────────────────────────

  async findMany(query: ProductQuery = {}): Promise<ProductPage> {
    const key    = this.cacheKey(query);
    const cached = this.pageCache.get(key);
    if (cached) return cached;

    const result = await listCJProducts({
      page:       query.page  ?? 1,
      size:       query.limit ?? 40,
      keyWord:    query.search,
      categoryId: query.categoryId,
      minPrice:   query.minPrice,
      maxPrice:   query.maxPrice,
      orderBy:    query.orderBy,
    });

    const page: ProductPage = {
      items:    result.list.map((p) => cjMapper.productListItem(p)),
      total:    result.total    ?? 0,
      page:     result.pageNum  ?? 1,
      pageSize: result.pageSize ?? 40,
      hasMore:  (result.pageNum * result.pageSize) < result.total,
    };

    this.pageCache.set(key, page, PAGE_TTL_MS);
    return page;
  }

  async findById(id: string): Promise<Product | null> {
    const cached = this.detailCache.get(id);
    if (cached) return cached;

    try {
      const detail  = await getCJProductDetail(id);
      const product = cjMapper.productDetail(detail);
      this.detailCache.set(id, product, DETAIL_TTL_MS);
      return product;
    } catch (err) {
      const appErr = toAppError(err);
      // A 404-like error means the product genuinely doesn't exist
      if (appErr.message.toLowerCase().includes("not found")) return null;
      // Re-throw all other errors so callers can handle them
      throw appErr;
    }
  }

  // ── Cache management (useful for admin operations) ───────────────────────

  /** Removes a specific product's detail from cache (e.g. after an edit). */
  invalidateDetail(id: string): void {
    this.detailCache.delete(id);
  }

  /** Clears all list-page cache entries (e.g. after a bulk import). */
  invalidateAllPages(): void {
    this.pageCache.clear();
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
// One shared instance for the whole app so the cache is shared across
// all consumers (StoreContext, admin pages, etc.).
export const productRepository: IProductRepository = new CJProductRepository();

// Export the concrete class so tests can instantiate fresh instances.
export { CJProductRepository };
