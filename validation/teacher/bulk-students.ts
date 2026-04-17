import { z } from 'zod';
import { DOMAIN_CODES } from '@/types/domain';

// Accept full domain codes (e.g. MUL_WHOLE) and shorthand (ADD → ADD_WHOLE)
const SHORTHAND: Record<string, string> = {
  ADD: 'ADD_WHOLE',
  SUB: 'SUB_WHOLE',
  MUL: 'MUL_WHOLE',
  DIV: 'DIV_WHOLE',
};

const domainSchema = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const upper = val.toUpperCase();
  return SHORTHAND[upper] ?? upper;
}, z.enum(DOMAIN_CODES));

export const bulkAddStudentsSchema = z.object({
  defaultStartingDomain: domainSchema.optional(),
  defaultStartingLevel: z.coerce.number().int().min(1).max(100).optional(),

  defaultLevel: z.coerce.number().int().min(1).max(100).optional(),

  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(1),

        level: z.coerce.number().int().min(1).max(100).optional(),

        startingDomain: domainSchema.optional(),
        startingLevel: z.coerce.number().int().min(1).max(100).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export type BulkAddStudentsRequest = z.infer<typeof bulkAddStudentsSchema>;

export const deleteAllStudentsSchema = z.object({
  deleteAssignments: z.boolean().optional().default(false),
  deleteSchedules: z.boolean().optional().default(false),
});

export type DeleteAllStudentsRequest = z.infer<typeof deleteAllStudentsSchema>;
