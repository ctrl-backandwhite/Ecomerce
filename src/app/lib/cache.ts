/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TTLCache — Generic in-memory time-to-live cache             ║
 * ║                                                              ║
 * ║  Designed for the browser's single-threaded environment.     ║
 * ║  Auto-evicts expired entries on access.                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  /**
   * Stores `value` under `key` for `ttlMs` milliseconds.
   * Overwrites any existing entry for the same key.
   */
  set(key: string, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Returns the cached value, or `undefined` if the key is
   * missing or the entry has expired.
   */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Returns true if a non-expired entry exists for `key`. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** Removes a specific key regardless of TTL. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Removes ALL entries (expired or not). Use to force a full refresh. */
  clear(): void {
    this.store.clear();
  }

  /** Removes only entries that have already expired. */
  evictExpired(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.expiresAt) this.store.delete(key);
    });
  }

  /** Number of live (non-expired) entries. */
  get size(): number {
    this.evictExpired();
    return this.store.size;
  }
}
