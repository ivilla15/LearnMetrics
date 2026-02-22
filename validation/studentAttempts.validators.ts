import { z } from 'zod';
import { ATTEMPT_EXPLORER_FILTERS, type AttemptExplorerFilter } from '@/types/ui/filters';

export const studentAttemptsQuerySchema = z.object({
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || (/^\d+$/.test(v) && Number(v) > 0), {
      message: 'Invalid cursor',
    })
    .optional(),

  filter: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : 'ALL'))
    .refine(
      (v): v is AttemptExplorerFilter =>
        ATTEMPT_EXPLORER_FILTERS.includes(v as AttemptExplorerFilter),
      {
        message: 'Invalid filter',
      },
    )
    .transform((v) => v as AttemptExplorerFilter),
});
