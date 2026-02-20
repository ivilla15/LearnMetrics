import { z } from 'zod';
import { OPERATION_CODES, MODIFIER_CODES } from '@/types/enums';

const operationSchema = z.enum(OPERATION_CODES);
const modifierSchema = z.enum(MODIFIER_CODES);

export const modifierRuleSchema = z.object({
  modifier: modifierSchema,
  operations: z.array(operationSchema).min(1),
  minLevel: z.coerce.number().int().min(1).max(100),
  propagate: z.coerce.boolean(),
  enabled: z.coerce.boolean(),
});

export const upsertProgressionPolicySchema = z.object({
  enabledOperations: z.array(operationSchema).min(1),
  operationOrder: z.array(operationSchema).min(1),
  maxNumber: z.coerce.number().int().min(1).max(100),
  modifierRules: z.array(modifierRuleSchema).default([]),
});

export type UpsertProgressionPolicyInput = z.infer<typeof upsertProgressionPolicySchema>;

export const upsertStudentProgressSchema = z.object({
  levels: z
    .array(
      z.object({
        operation: operationSchema,
        level: z.coerce.number().int().min(1).max(100),
      }),
    )
    .min(1),
});

export type UpsertStudentProgressInput = z.infer<typeof upsertStudentProgressSchema>;
