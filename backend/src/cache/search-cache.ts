import type { ValidatedSearchParams } from '../schemas/search-params';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SearchCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  size(): number {
    return this.store.size;
  }

  evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export function buildSearchCacheKey(params: ValidatedSearchParams): string {
  return [
    `q=${params.q?.toLowerCase() ?? ''}`,
    `vendor=${params.vendor?.toLowerCase() ?? ''}`,
    `min=${params.minPrice ?? ''}`,
    `max=${params.maxPrice ?? ''}`,
    `avail=${params.availability ?? ''}`,
    `page=${params.page}`,
    `size=${params.pageSize}`,
  ].join(':');
}
