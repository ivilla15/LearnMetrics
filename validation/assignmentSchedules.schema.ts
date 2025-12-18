import { z } from 'zod';

export const upsertScheduleSchema = z.object({
  opensAtLocalTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm, e.g. "08:00"'),
  windowMinutes: z.number().int().positive().max(60).optional(),
  isActive: z.boolean().optional(),
  days: z
    .array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']))
    .min(1, 'Select at least one day'),
});

export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
