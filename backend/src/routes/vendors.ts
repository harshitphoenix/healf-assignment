import { Router } from 'express';
import type { SearchService } from '../services/search-service';
import type { CatalogCache } from '../cache/catalog-cache';

export function createVendorsRouter(searchService: SearchService, cache: CatalogCache): Router {
  const router = Router();

  router.get('/vendors', (_req, res, next) => {
    try {
      if (!cache.isReady()) {
        res.status(503).json({ error: 'Product catalog is temporarily unavailable' });
        return;
      }
      const vendors = searchService.getVendors();
      res.json({ vendors });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
