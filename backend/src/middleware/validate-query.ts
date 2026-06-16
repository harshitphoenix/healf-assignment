import type { Request, Response, NextFunction } from 'express';
import { SearchParamsSchema, type ValidatedSearchParams } from '../schemas/search-params';

declare global {
  namespace Express {
    interface Request {
      validatedQuery: ValidatedSearchParams;
    }
  }
}

export function validateQuery(req: Request, res: Response, next: NextFunction): void {
  const result = SearchParamsSchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  req.validatedQuery = result.data;
  next();
}
