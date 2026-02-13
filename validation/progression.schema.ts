import { operationSchema } from '@/types';
import { z } from 'zod';

export const upsertProgressionPolicySchema = z.object({
  enabledOperations: z.array(operationSchema).min(1),
  maxNumber: z.number().int().min(1).max(100),
  divisionIntegersOnly: z.boolean(),
});

export const upsertStudentProgressSchema = z.object({
  levels: z
    .array(
      z.object({
        operation: operationSchema,
        level: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
});
