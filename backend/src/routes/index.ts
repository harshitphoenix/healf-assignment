import { Router } from 'express';
import type { SearchService } from '../services/search-service';
import type { CatalogCache } from '../cache/catalog-cache';
import { createHealthRouter } from './health';
import { createVendorsRouter } from './vendors';
import { createProductsRouter } from './products';

export function createRouter(searchService: SearchService, cache: CatalogCache): Router {
  const router = Router();

  router.use('/api', createHealthRouter(cache));
  router.use('/api/products', createVendorsRouter(searchService, cache));
  router.use('/api/products', createProductsRouter(searchService, cache));

  return router;
}
