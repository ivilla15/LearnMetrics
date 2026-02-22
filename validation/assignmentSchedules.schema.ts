import { z } from 'zod';
import { ASSIGNMENT_TYPES, OPERATION_CODES, RECIPIENT_RULES } from '@/types/enums';

const typeSchema = z.enum(ASSIGNMENT_TYPES);
const operationSchema = z.enum(OPERATION_CODES);
const recipientRuleSchema = z.enum(RECIPIENT_RULES);

const base = z.object({
  opensAtLocalTime: z.string().min(1),
  windowMinutes: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 60)
    .optional(),
  days: z.array(z.string().min(1)).min(1),
  isActive: z.coerce.boolean().optional(),

  operation: operationSchema.optional().nullable(),

  dependsOnScheduleId: z.coerce.number().int().positive().optional().nullable(),
  offsetMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .max(7 * 24 * 60)
    .optional(),
  recipientRule: recipientRuleSchema.optional(),
});

const assessment = base.extend({
  targetKind: z.literal('ASSESSMENT'),
  type: typeSchema,
  numQuestions: z.coerce.number().int().min(1).max(200).optional(),
  durationMinutes: z.undefined().optional(),
});

const practiceTime = base.extend({
  targetKind: z.literal('PRACTICE_TIME'),
  durationMinutes: z.coerce.number().int().min(1).max(240),
  type: z.undefined().optional(),
  numQuestions: z.undefined().optional(),
});

export const upsertScheduleSchema = z.discriminatedUnion('targetKind', [assessment, practiceTime]);

export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
