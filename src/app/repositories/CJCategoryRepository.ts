/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CJCategoryRepository                                        ║
 * ║                                                              ║
 * ║  Concrete ICategoryRepository backed by the supplier API.   ║
 * ║                                                              ║
 * ║  Fallback strategy (CORS / offline):                        ║
 * ║  Imports the real JSON response from the API                ║
 * ║  (womens-clothing-categories.json) and applies the same     ║
 * ║  flattenCJCategories + cjMapper pipeline so mock and live   ║
 * ║  data always produce identical Category shapes.             ║
 * ║                                                              ║
 * ║  Cache TTL: 30 minutes for live data.                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { getCJCategories, flattenCJCategories } from "../services/cjApi";
import { cjMapper }                             from "../mappers/cjMapper";
import { TTLCache }                             from "../lib/cache";
import { toAppError }                           from "../lib/AppError";
import type { ICategoryRepository }             from "./ICategoryRepository";
import type { Category }                        from "../data/adminData";

// ── Static mock — real API response stored locally ────────────────────────────
// This JSON is the exact payload that /product/getCategory returns.
// It is used as a fallback when the API is unreachable (CORS in development,
// offline mode, etc.).  No transformation needed; the same pipeline that
// processes live data processes this file.
import mockApiResponse from "../../imports/pasted_text/womens-clothing-categories.json";

const CATEGORIES_TTL_MS = 30 * 60_000; // 30 minutes

// ── Pre-parse the static mock once at module load time ────────────────────────
// Shape: { code, result, message, data: CJCategoryFirst[] }
const MOCK_CATEGORIES: Category[] = flattenCJCategories(
  (mockApiResponse as any).data ?? [],
).map((c, i) => cjMapper.category(c, i));

// ─────────────────────────────────────────────────────────────────────────────

class CJCategoryRepository implements ICategoryRepository {
  private readonly cache = new TTLCache<Category[]>();

  async findAll(): Promise<Category[]> {
    const cached = this.cache.get("all");
    if (cached) return cached;

    try {
      // ── Attempt live supplier API ────────────────────────────────────────
      const cjCats    = await getCJCategories();
      const categories = cjCats.map((c, i) => cjMapper.category(c, i));
      this.cache.set("all", categories, CATEGORIES_TTL_MS);
      return categories;
    } catch (err) {
      throw toAppError(err);
    }
  }

  async findById(id: string): Promise<Category | null> {
    const all = await this.findAll();
    return all.find((c) => c.id === id) ?? null;
  }

  /** Forces the next call to `findAll()` to re-fetch from the API. */
  invalidate(): void {
    this.cache.delete("all");
  }

  /**
   * Returns the pre-parsed mock categories (from the local JSON snapshot).
   * Used by StoreContext when the live API is unreachable.
   */
  static getMockCategories(): Category[] {
    return MOCK_CATEGORIES;
  }
}

// Singleton
export const categoryRepository: ICategoryRepository = new CJCategoryRepository();

export { CJCategoryRepository };