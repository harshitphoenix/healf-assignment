import type { Product, ProductsResponse } from '../types/product';
import type { ValidatedSearchParams } from '../schemas/search-params';
import type { CatalogCache } from '../cache/catalog-cache';

export class SearchService {
  constructor(private readonly cache: CatalogCache) {}

  search(params: ValidatedSearchParams): ProductsResponse {
    let filtered = this.cache.getProducts();

    if (params.q) {
      const tokens = params.q
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(Boolean);

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

    return {
      products,
      meta: { page: params.page, pageSize: params.pageSize, totalResults, totalPages },
    };
  }

  getVendors(): string[] {
    const vendors = [
      ...new Set(this.cache.getProducts().map((p) => p.vendor).filter(Boolean)),
    ];
    return vendors.sort();
  }
}
