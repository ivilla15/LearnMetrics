import { z } from 'zod';
import { OPERATION_CODES, MODIFIER_CODES } from '@/types/enums';

const operationSchema = z.enum(OPERATION_CODES);
const modifierSchema = z.enum(MODIFIER_CODES);

function unique<T>(arr: T[]) {
  return new Set(arr).size === arr.length;
}

export const modifierRuleSchema = z.object({
  modifier: modifierSchema,
  operations: z.array(operationSchema).min(1).refine(unique, 'Duplicate operations not allowed'),
  minLevel: z.coerce.number().int().min(1).max(100),
  propagate: z.coerce.boolean(),
  enabled: z.coerce.boolean(),
});

export const upsertProgressionPolicySchema = z
  .object({
    enabledOperations: z
      .array(operationSchema)
      .min(1)
      .refine(unique, 'Duplicate enabledOperations not allowed'),
    operationOrder: z
      .array(operationSchema)
      .min(1)
      .refine(unique, 'Duplicate operationOrder not allowed'),
    maxNumber: z.coerce.number().int().min(1).max(100),
    modifierRules: z.array(modifierRuleSchema).default([]),
  })
  .superRefine((val, ctx) => {
    const enabled = new Set(val.enabledOperations);
    const invalid = val.operationOrder.filter((op) => !enabled.has(op));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operationOrder'],
        message: `operationOrder contains ops not in enabledOperations: ${invalid.join(', ')}`,
      });
    }
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
    .min(1)
    .refine((rows) => unique(rows.map((r) => r.operation)), 'Duplicate operations in levels'),
});

export type UpsertStudentProgressInput = z.infer<typeof upsertStudentProgressSchema>;
