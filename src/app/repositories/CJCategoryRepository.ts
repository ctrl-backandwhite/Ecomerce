/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CJCategoryRepository                                        ║
 * ║                                                              ║
 * ║  Concrete ICategoryRepository backed by the CJ API.         ║
 * ║  Categories rarely change — 30-minute TTL cache.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { getCJCategories }        from "../services/cjApi";
import { cjMapper }               from "../mappers/cjMapper";
import { TTLCache }               from "../lib/cache";
import { toAppError }             from "../lib/AppError";
import type { ICategoryRepository } from "./ICategoryRepository";
import type { Category }          from "../data/adminData";

const CATEGORIES_TTL_MS = 30 * 60_000; // 30 minutes

class CJCategoryRepository implements ICategoryRepository {
  private readonly cache = new TTLCache<Category[]>();

  async findAll(): Promise<Category[]> {
    const cached = this.cache.get("all");
    if (cached) return cached;

    try {
      const cjCats    = await getCJCategories();
      const categories = (Array.isArray(cjCats) ? cjCats : []).map(
        (c, i) => cjMapper.category(c, i),
      );
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
}

// Singleton
export const categoryRepository: ICategoryRepository = new CJCategoryRepository();

export { CJCategoryRepository };
