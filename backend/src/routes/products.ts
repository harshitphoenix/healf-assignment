import { Router } from 'express';
import type { SearchService } from '../services/search-service';
import type { CatalogCache } from '../cache/catalog-cache';
import { validateQuery } from '../middleware/validate-query';

export function createProductsRouter(searchService: SearchService, cache: CatalogCache): Router {
  const router = Router();

  router.get('/', validateQuery, (req, res, next) => {
    try {
      if (!cache.isReady()) {
        res.status(503).json({ error: 'Product catalog is temporarily unavailable' });
        return;
      }
      const result = searchService.search(req.validatedQuery);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
