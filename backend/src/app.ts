import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { SearchService } from './services/search-service';
import type { CatalogCache } from './cache/catalog-cache';
import { createRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

export function createApp(searchService: SearchService, cache: CatalogCache): express.Application {
  const app = express();
  const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

  // Security headers — pure JSON API so disable HTML-specific defaults
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"] },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json());
  app.use(requestLogger);
  app.use(createRouter(searchService, cache));
  app.use(errorHandler);

  return app;
}
