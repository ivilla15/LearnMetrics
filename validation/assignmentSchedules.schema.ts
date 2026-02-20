import { z } from 'zod';
import {
  ASSIGNMENT_TARGET_KINDS,
  ASSIGNMENT_TYPES,
  OPERATION_CODES,
  RECIPIENT_RULES,
  WeekdayEnum,
} from '@/types/enums';

const idSchema = z.coerce.number().int().positive();
const hhmmSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm (e.g. "08:00")');

const assignmentTargetKindSchema = z.enum(ASSIGNMENT_TARGET_KINDS);
const assignmentTypeSchema = z.enum(ASSIGNMENT_TYPES);
const operationSchema = z.enum(OPERATION_CODES);
const recipientRuleSchema = z.enum(RECIPIENT_RULES);

export const upsertAssignmentScheduleSchema = z
  .object({
    classroomId: idSchema.optional(),

    isActive: z.coerce.boolean().default(true),
    days: z.array(z.enum(WeekdayEnum)).min(1, 'Select at least one day'),

    opensAtLocalTime: hhmmSchema,
    windowMinutes: z.coerce.number().int().min(1).max(600).default(4),

    targetKind: assignmentTargetKindSchema.default('ASSESSMENT'),

    // ASSESSMENT fields
    type: assignmentTypeSchema.optional(),
    numQuestions: z.coerce.number().int().min(1).max(200).default(12),
    operation: operationSchema.optional(),

    // PRACTICE_TIME fields
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),

    // Dependency scheduling
    dependsOnScheduleId: idSchema.nullable().optional(),
    offsetMinutes: z.coerce.number().int().min(0).max(1440).default(0),
    recipientRule: recipientRuleSchema.default('ALL'),
  })
  .superRefine((v, ctx) => {
    const isDependent = v.dependsOnScheduleId !== null && v.dependsOnScheduleId !== undefined;

    if (isDependent && !v.recipientRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'recipientRule is required when dependsOnScheduleId is set',
        path: ['recipientRule'],
      });
    }

    if (v.targetKind === 'ASSESSMENT') {
      if (!v.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'type is required for ASSESSMENT schedules',
          path: ['type'],
        });
      }

      // PRACTICE schedules must specify operation (per your requirement)
      if (v.type === 'PRACTICE' && !v.operation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'operation is required for PRACTICE schedules',
          path: ['operation'],
        });
      }

      if (v.durationMinutes !== undefined && v.durationMinutes !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'durationMinutes is only valid for PRACTICE_TIME schedules',
          path: ['durationMinutes'],
        });
      }
      return;
    }

    if (v.targetKind === 'PRACTICE_TIME') {
      if (typeof v.durationMinutes !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'durationMinutes is required for PRACTICE_TIME schedules',
          path: ['durationMinutes'],
        });
      }

      if (v.type !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'type is not valid for PRACTICE_TIME schedules',
          path: ['type'],
        });
      }
      if (v.operation !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'operation is not valid for PRACTICE_TIME schedules',
          path: ['operation'],
        });
      }
    }
  });

export type UpsertAssignmentScheduleInput = z.infer<typeof upsertAssignmentScheduleSchema>;
