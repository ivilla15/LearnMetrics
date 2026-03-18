import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();
const isoDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'runDate must be YYYY-MM-DD');

export const skipScheduleRunSchema = z.object({
  scheduleId: idSchema,
  runDate: isoDaySchema,
  reason: z.string().max(500).optional(),
});
export type SkipScheduleRunInput = z.infer<typeof skipScheduleRunSchema>;

export const unskipScheduleRunSchema = z.object({
  scheduleId: idSchema,
  runDate: isoDaySchema,
});
export type UnskipScheduleRunInput = z.infer<typeof unskipScheduleRunSchema>;
