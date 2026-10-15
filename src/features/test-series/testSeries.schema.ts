import { z } from 'zod';

export const seriesFilterSchema = z.object({
  search: z.string().max(120).default(''),
  accessType: z.enum(['', 'free', 'paid']).default(''),
  sort: z.enum(['popular', 'newest', 'price_asc', 'price_desc']).default('popular'),
});

export type SeriesFilters = z.infer<typeof seriesFilterSchema>;
