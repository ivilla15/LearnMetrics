import { z } from 'zod';

export const createScheduleRequestSchema = z.object({
  classroomId: z.coerce.number().int().positive(),

  // Optional: server can choose a default if not provided
  questionSetId: z.coerce.number().int().positive().optional(),

  // Optional overrides; if missing, use schedule / defaults
  scheduleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  opensAtLocalTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/) // "HH:mm"
    .optional(),

  windowMinutes: z.coerce.number().int().positive().max(60).optional(),
  numQuestions: z.coerce.number().int().min(1).max(12).default(12),
});

export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;
