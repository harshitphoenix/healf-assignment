import path from 'path';
import { CsvRepository } from './repository/csv-repository';
import { CatalogCache } from './cache/catalog-cache';
import { SearchService } from './services/search-service';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CSV_PATH =
  process.env.PRODUCTS_CSV_PATH ?? path.join(process.cwd(), 'data', 'products.csv');

async function main(): Promise<void> {
  const repository = new CsvRepository(CSV_PATH);
  const cache = new CatalogCache(repository);

  console.log('[startup] Loading product catalog from:', CSV_PATH);
  try {
    await cache.load();
    console.log(`[startup] Catalog loaded: ${cache.getCount()} products`);
  } catch (err) {
    console.error(
      '[startup] Failed to load catalog:',
      err instanceof Error ? err.message : err,
    );
    // Serve 503 from the API rather than exiting — allows hot-swap of the CSV
  }

  const searchService = new SearchService(cache);
  const app = createApp(searchService, cache);

  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error('[fatal]', err);
  process.exit(1);
});
