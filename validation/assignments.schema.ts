import { z } from 'zod';
import {
  ASSIGNMENT_TARGET_KINDS,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_MODES,
  OPERATION_CODES,
} from '@/types/enums';

const assignmentTargetKindSchema = z.enum(ASSIGNMENT_TARGET_KINDS);
const assignmentTypeSchema = z.enum(ASSIGNMENT_TYPES);
const assignmentModeSchema = z.enum(ASSIGNMENT_MODES);
const operationSchema = z.enum(OPERATION_CODES);

const idSchema = z.coerce.number().int().positive();
const isoDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmmSchema = z.string().regex(/^\d{2}:\d{2}$/);

const MAX_LIMIT = 100;

export const createScheduleRequestSchema = z
  .object({
    classroomId: idSchema,

    scheduleDate: isoDaySchema.optional(),
    opensAtLocalTime: hhmmSchema.optional(),

    windowMinutes: z.coerce.number().int().min(1).max(600).optional(),

    targetKind: assignmentTargetKindSchema.default('ASSESSMENT'),

    // assessment fields
    type: assignmentTypeSchema.optional(),
    numQuestions: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
    operation: operationSchema.optional(),

    // targeted recipients
    studentIds: z.array(idSchema).min(1).optional(),

    // practice-time fields
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.targetKind === 'ASSESSMENT') {
      if (!v.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'type is required for ASSESSMENT',
          path: ['type'],
        });
      }
      if (typeof v.numQuestions !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'numQuestions is required for ASSESSMENT',
          path: ['numQuestions'],
        });
      }
    }

    if (v.targetKind === 'PRACTICE_TIME') {
      if (typeof v.durationMinutes !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'durationMinutes is required for PRACTICE_TIME',
          path: ['durationMinutes'],
        });
      }
    }
  });

export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;

export const createManualAssignmentRequestSchema = z
  .object({
    targetKind: assignmentTargetKindSchema.default('ASSESSMENT'),

    type: assignmentTypeSchema.optional(),
    mode: assignmentModeSchema.default('MANUAL'),
    operation: operationSchema.optional(),

    opensAt: z.string().datetime(),
    closesAt: z.string().datetime().nullable(),

    windowMinutes: z.coerce.number().int().min(1).max(600).optional(),
    numQuestions: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),

    studentIds: z.array(idSchema).min(1),
    durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.targetKind === 'ASSESSMENT') {
      if (!v.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'type is required for ASSESSMENT',
          path: ['type'],
        });
      }
      if (typeof v.numQuestions !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'numQuestions is required for ASSESSMENT',
          path: ['numQuestions'],
        });
      }
      if (v.durationMinutes !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'durationMinutes is only valid for PRACTICE_TIME',
          path: ['durationMinutes'],
        });
      }
    }

    if (v.targetKind === 'PRACTICE_TIME') {
      if (typeof v.durationMinutes !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'durationMinutes is required for PRACTICE_TIME',
          path: ['durationMinutes'],
        });
      }
      if (v.type !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'type is not valid for PRACTICE_TIME',
          path: ['type'],
        });
      }
      if (v.operation !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'operation is not valid for PRACTICE_TIME',
          path: ['operation'],
        });
      }
      if (v.numQuestions !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'numQuestions is not valid for PRACTICE_TIME',
          path: ['numQuestions'],
        });
      }
    }

    if (v.closesAt) {
      const opens = new Date(v.opensAt).getTime();
      const closes = new Date(v.closesAt).getTime();
      if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'closesAt must be after opensAt',
          path: ['closesAt'],
        });
      }
    }
  });

export type CreateManualAssignmentRequest = z.infer<typeof createManualAssignmentRequestSchema>;

export const updateTeacherAssignmentSchema = z
  .object({
    opensAt: z.string().datetime().optional(),
    closesAt: z.string().datetime().nullable().optional(),
    windowMinutes: z.coerce.number().int().min(1).max(600).optional(),
    numQuestions: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.opensAt || !v.closesAt) return;

    const opens = new Date(v.opensAt).getTime();
    const closes = new Date(v.closesAt).getTime();
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'closesAt must be after opensAt',
        path: ['closesAt'],
      });
    }
  });

export type UpdateTeacherAssignmentInput = z.infer<typeof updateTeacherAssignmentSchema>;
