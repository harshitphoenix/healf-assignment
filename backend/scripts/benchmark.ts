/**
 * Performance benchmark — asserts p95 search latency < 300ms
 * Usage: npx tsx scripts/benchmark.ts
 */
import path from 'path';
import { CsvRepository } from '../src/repository/csv-repository';
import { CatalogCache } from '../src/cache/catalog-cache';
import { SearchCache } from '../src/cache/search-cache';
import { SearchService } from '../src/services/search-service';

const CSV_PATH =
  process.env.PRODUCTS_CSV_PATH ?? path.join(process.cwd(), 'data', 'products.csv');

const SAMPLE_QUERIES: Array<{
  q?: string;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: boolean;
  page: number;
  pageSize: number;
}> = [
  { page: 1, pageSize: 20 },
  { q: 'vitamin', page: 1, pageSize: 20 },
  { q: 'protein', page: 1, pageSize: 20 },
  { q: 'magnesium', page: 1, pageSize: 20 },
  { q: 'omega', page: 1, pageSize: 20 },
  { vendor: 'Now Foods', page: 1, pageSize: 20 },
  { minPrice: 10, maxPrice: 30, page: 1, pageSize: 20 },
  { availability: true, page: 1, pageSize: 20 },
  { q: 'zinc', availability: true, page: 1, pageSize: 20 },
  { q: 'collagen', minPrice: 20, page: 1, pageSize: 10 },
];

async function benchmark(): Promise<void> {
  const repository = new CsvRepository(CSV_PATH);
  const cache = new CatalogCache(repository);
  await cache.load();

  // Use fresh search cache per run to measure compute time, not cache hits
  const ITERATIONS = 100;
  const durations: number[] = [];

  console.log(`[benchmark] ${cache.getCount()} products loaded`);
  console.log(`[benchmark] Running ${ITERATIONS} queries...`);

  for (let i = 0; i < ITERATIONS; i++) {
    const query = SAMPLE_QUERIES[i % SAMPLE_QUERIES.length];
    const searchCache = new SearchCache();
    const service = new SearchService(cache, searchCache);

    const start = performance.now();
    service.search({ page: 1, pageSize: 20, ...query });
    durations.push(performance.now() - start);
  }

  durations.sort((a, b) => a - b);
  const p50 = durations[Math.floor(ITERATIONS * 0.5)];
  const p95 = durations[Math.floor(ITERATIONS * 0.95)];
  const p99 = durations[Math.floor(ITERATIONS * 0.99)];
  const max = durations[ITERATIONS - 1];

  console.log(`[benchmark] Results (${ITERATIONS} iterations, uncached):`);
  console.log(`  p50 : ${p50.toFixed(3)} ms`);
  console.log(`  p95 : ${p95.toFixed(3)} ms`);
  console.log(`  p99 : ${p99.toFixed(3)} ms`);
  console.log(`  max : ${max.toFixed(3)} ms`);

  const P95_TARGET_MS = 300;
  if (p95 > P95_TARGET_MS) {
    console.error(`[benchmark] FAIL — p95 ${p95.toFixed(1)}ms exceeds ${P95_TARGET_MS}ms target`);
    process.exit(1);
  }

  console.log(`[benchmark] PASS — p95 ${p95.toFixed(1)}ms is within ${P95_TARGET_MS}ms target`);
}

benchmark().catch((err: unknown) => {
  console.error('[benchmark] Error:', err);
  process.exit(1);
});
