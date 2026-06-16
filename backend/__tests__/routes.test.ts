import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { CatalogCache } from '../src/cache/catalog-cache';
import { SearchCache } from '../src/cache/search-cache';
import { SearchService } from '../src/services/search-service';
import { createApp } from '../src/app';
import type { Product } from '../src/types/product';

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
    description: 'Heart health',
    vendor: 'Nordic Naturals',
    price: 29.99,
    inventory: 0,
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Gamma Magnesium',
    description: 'Muscle relaxation',
    vendor: "Doctor's Best",
    price: 18.99,
    inventory: 100,
    imageUrl: null,
  },
];

async function makeApp(products = PRODUCTS) {
  const repo = { getAll: async () => [...products] };
  const cache = new CatalogCache(repo);
  await cache.load();
  const service = new SearchService(cache, new SearchCache());
  return createApp(service, cache);
}

describe('GET /api/products', () => {
  it('returns 200 with products array and meta object', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: 1,
      pageSize: 20,
      totalResults: 3,
      totalPages: 1,
    });
  });

  it('filters products by text query', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products?q=vitamin');

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].id).toBe('1');
  });

  it('paginates results with pageSize and page params', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products?pageSize=2&page=2');

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1); // 3 products, page 2 of pageSize 2
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('returns 400 when pageSize exceeds 100', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products?pageSize=101');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when maxPrice is less than minPrice', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products?minPrice=50&maxPrice=10');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 for non-numeric price params', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products?minPrice=abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request' });
  });

  it('returns 503 when the catalog is empty', async () => {
    const app = await makeApp([]);
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/products/vendors', () => {
  it('returns a sorted array of vendor names', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/products/vendors');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vendors: ["Doctor's Best", 'Nordic Naturals', 'Now Foods'] });
  });

  it('returns 503 when the catalog is empty', async () => {
    const app = await makeApp([]);
    const res = await request(app).get('/api/products/vendors');

    expect(res.status).toBe(503);
  });
});

describe('GET /api/health', () => {
  it('returns 200 with status ok and productCount', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', productCount: 3 });
  });

  it('returns 503 when the catalog is empty', async () => {
    const app = await makeApp([]);
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
  });
});

describe('CORS', () => {
  it('responds to a preflight request from the allowed origin', async () => {
    const app = await makeApp();
    const res = await request(app)
      .options('/api/products')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});

describe('Security headers', () => {
  it('includes X-Content-Type-Options: nosniff on API responses', async () => {
    const app = await makeApp();
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
