import express from 'express';
import cors from 'cors';
import type { SearchService } from './services/search-service';
import type { CatalogCache } from './cache/catalog-cache';
import { createRouter } from './routes';
import { errorHandler } from './middleware/error-handler';

export function createApp(searchService: SearchService, cache: CatalogCache): express.Application {
  const app = express();
  const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json());
  app.use(createRouter(searchService, cache));
  app.use(errorHandler);

  return app;
}
