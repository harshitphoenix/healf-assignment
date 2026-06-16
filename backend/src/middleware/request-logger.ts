import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  const startMs = Date.now();

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - startMs,
        query: {
          q: sanitize(req.query['q']),
          vendor: sanitize(req.query['vendor']),
          minPrice: sanitize(req.query['minPrice']),
          maxPrice: sanitize(req.query['maxPrice']),
          availability: sanitize(req.query['availability']),
          page: sanitize(req.query['page']),
          pageSize: sanitize(req.query['pageSize']),
        },
      }),
    );
  });

  next();
}
