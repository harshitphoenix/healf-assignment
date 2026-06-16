import { z } from 'zod';

export const CsvRowSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  vendor: z.string().trim().default(''),
  price: z.string().transform((val, ctx) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid price' });
      return z.NEVER;
    }
    return n;
  }),
  inventory: z.string().transform((val, ctx) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid inventory' });
      return z.NEVER;
    }
    return n;
  }),
  image_url: z
    .string()
    .optional()
    .transform((val) => val?.trim() || null),
});

export type CsvRow = z.infer<typeof CsvRowSchema>;
