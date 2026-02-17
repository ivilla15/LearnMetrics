import { z } from 'zod';
import { operationSchema, modifierSchema } from '@/types/progression';

export const modifierRuleSchema = z.object({
  modifier: modifierSchema,
  operations: z.array(operationSchema).min(1),
  minLevel: z.number().int().min(1).max(100),
  propagate: z.boolean(),
  enabled: z.boolean(),
});

export const upsertProgressionPolicySchema = z.object({
  enabledOperations: z.array(operationSchema).min(1),
  operationOrder: z.array(operationSchema).min(1),
  maxNumber: z.number().int().min(1).max(100),
  modifierRules: z.array(modifierRuleSchema),
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
