import { Router } from 'express';
import type { CatalogCache } from '../cache/catalog-cache';

export function createHealthRouter(cache: CatalogCache): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const count = cache.getCount();
    if (count === 0) {
      res.status(503).json({
        status: 'unavailable',
        error: 'Product catalog is temporarily unavailable',
      });
      return;
    }
    res.json({ status: 'ok', productCount: count });
  });

  return router;
}
