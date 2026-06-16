import type { Product, ProductsResponse } from '../types/product';
import type { ValidatedSearchParams } from '../schemas/search-params';
import type { CatalogCache } from '../cache/catalog-cache';
import { SearchCache, buildSearchCacheKey } from '../cache/search-cache';

export class SearchService {
  constructor(
    private readonly cache: CatalogCache,
    private readonly searchCache: SearchCache,
  ) {}

  search(params: ValidatedSearchParams): ProductsResponse {
    const key = buildSearchCacheKey(params);
    const cached = this.searchCache.get<ProductsResponse>(key);
    if (cached) {
      console.log(`[search-cache] HIT ${key}`);
      return cached;
    }

    let filtered = this.cache.getProducts();

    if (params.q) {
      const tokens = params.q.toLowerCase().replace(/\s+/g, ' ').split(' ').filter(Boolean);

      filtered = filtered.filter((p) =>
        tokens.every(
          (token) =>
            p.title.toLowerCase().includes(token) ||
            p.description.toLowerCase().includes(token) ||
            p.vendor.toLowerCase().includes(token),
        ),
      );
    }

    if (params.vendor) {
      const vendorLower = params.vendor.toLowerCase();
      filtered = filtered.filter((p) => p.vendor.toLowerCase() === vendorLower);
    }

    if (params.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= (params.minPrice as number));
    }

    if (params.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= (params.maxPrice as number));
    }

    if (params.availability !== undefined) {
      filtered = params.availability
        ? filtered.filter((p) => p.inventory > 0)
        : filtered.filter((p) => p.inventory <= 0);
    }

    // Deterministic sort: title asc, then id asc (NFR-4)
    const sorted = [...filtered].sort((a: Product, b: Product) => {
      const titleCmp = a.title.localeCompare(b.title);
      return titleCmp !== 0 ? titleCmp : a.id.localeCompare(b.id);
    });

    const totalResults = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / params.pageSize));
    const start = (params.page - 1) * params.pageSize;
    const products = sorted.slice(start, start + params.pageSize);

    const result: ProductsResponse = {
      products,
      meta: { page: params.page, pageSize: params.pageSize, totalResults, totalPages },
    };

    console.log(`[search-cache] MISS ${key}`);
    this.searchCache.set(key, result);
    return result;
  }

  getVendors(): string[] {
    const vendors = [
      ...new Set(
        this.cache
          .getProducts()
          .map((p) => p.vendor)
          .filter(Boolean),
      ),
    ];
    return vendors.sort();
  }
}
