import { z } from 'zod';

export const SearchParamsSchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    vendor: z.string().trim().max(100).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    availability: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || maxPrice >= minPrice,
    { message: 'maxPrice must be >= minPrice', path: ['maxPrice'] },
  );

export type ValidatedSearchParams = z.infer<typeof SearchParamsSchema>;
