import { z } from 'zod';

export const createScheduleRequestSchema = z.object({
  classroomId: z.coerce.number().int().positive(),

  questionSetId: z.coerce.number().int().positive().optional(),

  scheduleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  opensAtLocalTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),

  windowMinutes: z.coerce.number().int().positive().max(60).optional(),
  numQuestions: z.coerce.number().int().min(1).max(12).default(12),

  studentIds: z.array(z.number().int().positive()).min(1).optional(),
});

export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;

export const createManualAssignmentRequestSchema = z.object({
  questionSetId: z.coerce.number().int().positive().optional(),

  opensAt: z.string().min(1),
  closesAt: z.string().min(1),

  windowMinutes: z.coerce.number().int().positive().max(60).optional(),
  numQuestions: z.coerce.number().int().min(1).max(12).default(12),

  studentIds: z.array(z.number().int().positive()).min(1),
});

export type CreateManualAssignmentRequest = z.infer<typeof createManualAssignmentRequestSchema>;
