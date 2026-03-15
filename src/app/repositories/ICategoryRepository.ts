/**
 * ICategoryRepository — contract for category data access.
 */

import type { Category } from "../data/adminData";

export interface ICategoryRepository {
  /** Returns all available categories, applying caching internally. */
  findAll(): Promise<Category[]>;

  /** Returns a single category by ID, or `null` if not found. */
  findById(id: string): Promise<Category | null>;
}
