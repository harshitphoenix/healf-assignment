import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogCache } from '../src/cache/catalog-cache';
import { SearchCache } from '../src/cache/search-cache';
import { SearchService } from '../src/services/search-service';
import type { Product } from '../src/types/product';

// Greek-letter prefixes make alphabetical sort order obvious in assertions
const PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Alpha Vitamin D3',
    description: 'Bone health',
    vendor: 'Now Foods',
    price: 12.99,
    inventory: 200,
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Beta Omega-3 Fish Oil',
    description: 'Heart health omega',
    vendor: 'Nordic Naturals',
    price: 29.99,
    inventory: 50,
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Gamma Magnesium',
    description: 'Muscle relaxation',
    vendor: "Doctor's Best",
    price: 18.99,
    inventory: 0,
    imageUrl: null,
  },
  {
    id: '4',
    title: 'Delta Zinc Picolinate',
    description: 'Immune support',
    vendor: 'Now Foods',
    price: 9.99,
    inventory: 100,
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Epsilon Whey Protein',
    description: 'Muscle building',
    vendor: 'Optimum Nutrition',
    price: 54.99,
    inventory: 30,
    imageUrl: null,
  },
];

async function makeService(products = PRODUCTS): Promise<SearchService> {
  const repo = { getAll: async () => [...products] };
  const cache = new CatalogCache(repo);
  await cache.load();
  return new SearchService(cache, new SearchCache());
}

const BASE = { page: 1, pageSize: 20 } as const;

describe('SearchService — text search', () => {
  it('returns all products when no query is given', async () => {
    const service = await makeService();
    const { meta } = service.search(BASE);
    expect(meta.totalResults).toBe(5);
  });

  it('matches by title (case-insensitive)', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, q: 'VITAMIN' });
    expect(products.map((p) => p.id)).toEqual(['1']);
  });

  it('matches by description', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, q: 'muscle' });
    const ids = products.map((p) => p.id).sort();
    expect(ids).toEqual(['3', '5']);
  });

  it('matches by vendor', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, q: 'now' });
    expect(products.every((p) => p.vendor === 'Now Foods')).toBe(true);
  });

  it('requires ALL tokens to match (AND logic)', async () => {
    const service = await makeService();
    // 'omega' matches id=2 title AND 'heart' matches id=2 description → only id=2
    const { products } = service.search({ ...BASE, q: 'omega heart' });
    expect(products.map((p) => p.id)).toEqual(['2']);
  });

  it('returns no results when a token has no match', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, q: 'zzz' });
    expect(products).toHaveLength(0);
  });
});

describe('SearchService — vendor filter', () => {
  it('filters to a single vendor', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, vendor: 'Now Foods' });
    expect(products.every((p) => p.vendor === 'Now Foods')).toBe(true);
    expect(products).toHaveLength(2);
  });

  it('vendor match is case-insensitive', async () => {
    const service = await makeService();
    const { products: lower } = service.search({ ...BASE, vendor: 'now foods' });
    const { products: mixed } = service.search({ ...BASE, vendor: 'Now Foods' });
    expect(lower.map((p) => p.id)).toEqual(mixed.map((p) => p.id));
  });

  it('returns empty results for an unknown vendor', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, vendor: 'Unknown Vendor' });
    expect(products).toHaveLength(0);
  });
});

describe('SearchService — price filters', () => {
  it('applies minPrice (inclusive)', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, minPrice: 18.99 });
    expect(products.every((p) => p.price >= 18.99)).toBe(true);
  });

  it('applies maxPrice (inclusive)', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, maxPrice: 18.99 });
    expect(products.every((p) => p.price <= 18.99)).toBe(true);
  });

  it('applies both minPrice and maxPrice together', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, minPrice: 10, maxPrice: 20 });
    expect(products.every((p) => p.price >= 10 && p.price <= 20)).toBe(true);
    expect(products.map((p) => p.id).sort()).toEqual(['1', '3']); // 12.99 and 18.99
  });

  it('returns no results when minPrice is above all prices', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, minPrice: 1000 });
    expect(products).toHaveLength(0);
  });
});

describe('SearchService — availability filter', () => {
  it('availability=true keeps only in-stock products', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, availability: true });
    expect(products.every((p) => p.inventory > 0)).toBe(true);
    expect(products).toHaveLength(4); // id=3 (inventory=0) excluded
  });

  it('availability=false keeps only out-of-stock products', async () => {
    const service = await makeService();
    const { products } = service.search({ ...BASE, availability: false });
    expect(products.every((p) => p.inventory === 0)).toBe(true);
    expect(products.map((p) => p.id)).toEqual(['3']);
  });
});

describe('SearchService — combined filters', () => {
  it('combines text query, vendor, and availability correctly', async () => {
    const service = await makeService();
    // q='muscle' matches id=3 (magnesium) and id=5 (whey)
    // vendor='Optimum Nutrition' narrows to id=5 only
    // availability=true confirms id=5 is in stock
    const { products } = service.search({
      ...BASE,
      q: 'muscle',
      vendor: 'Optimum Nutrition',
      availability: true,
    });
    expect(products.map((p) => p.id)).toEqual(['5']);
  });
});

describe('SearchService — sort order', () => {
  it('sorts results by title ascending, then id ascending', async () => {
    const service = await makeService();
    const { products } = service.search(BASE);
    const titles = products.map((p) => p.title);
    // Expected alpha order: Alpha < Beta < Delta < Epsilon < Gamma
    expect(titles).toEqual([
      'Alpha Vitamin D3',
      'Beta Omega-3 Fish Oil',
      'Delta Zinc Picolinate',
      'Epsilon Whey Protein',
      'Gamma Magnesium',
    ]);
  });
});

describe('SearchService — pagination', () => {
  it('respects pageSize and returns correct slice', async () => {
    const service = await makeService();
    const { products, meta } = service.search({ page: 1, pageSize: 2 });
    expect(products).toHaveLength(2);
    expect(meta.totalResults).toBe(5);
    expect(meta.totalPages).toBe(3);
  });

  it('returns the correct page when paginating through results', async () => {
    const service = await makeService();
    const page1 = service.search({ page: 1, pageSize: 2 });
    const page2 = service.search({ page: 2, pageSize: 2 });
    const allIds = [...page1.products, ...page2.products].map((p) => p.id);
    expect(new Set(allIds).size).toBe(4); // no overlap between pages
  });

  it('returns an empty products array for a page beyond total', async () => {
    const service = await makeService();
    const { products, meta } = service.search({ page: 999, pageSize: 20 });
    expect(products).toHaveLength(0);
    expect(meta.totalResults).toBe(5); // total is still correct
  });
});

describe('SearchService — getVendors', () => {
  it('returns a sorted list of unique vendors', async () => {
    const service = await makeService();
    const vendors = service.getVendors();
    expect(vendors).toEqual(["Doctor's Best", 'Nordic Naturals', 'Now Foods', 'Optimum Nutrition']);
  });

  it('returns empty array when catalog is empty', async () => {
    const service = await makeService([]);
    expect(service.getVendors()).toEqual([]);
  });
});
