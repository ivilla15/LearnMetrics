// src/validation/assignmentSchedules.schema.ts
import { z } from 'zod';

// "HH:mm" 24-hour time, like "08:00", "13:30"
const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format');

// For now, we accept 1–180 minutes (3 hours max)
const windowMinutesSchema = z
  .number()
  .int()
  .min(1, 'Window must be at least 1 minute')
  .max(180, 'Window cannot be longer than 180 minutes');

// Payload for creating or replacing a schedule for a classroom
export const upsertScheduleSchema = z.object({
  questionSetId: z.coerce.number().int().positive(),
  opensAtLocalTime: timeStringSchema,
  windowMinutes: z.coerce.number().int().optional().default(4),
  isActive: z.boolean().optional().default(true),
});

export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
