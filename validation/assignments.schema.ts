import { z } from 'zod';

export const createFridayRequestSchema = z.object({
  classroomId: z.coerce.number().int().positive(),
  questionSetId: z.coerce.number().int().positive(),

  fridayDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/) // "YYYY-MM-DD"
    .optional(),

  opensAtLocalTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/) // "HH:mm"
    .optional(),

  windowMinutes: z.coerce.number().int().positive().max(60).optional(),
});

export type CreateFridayRequest = z.infer<typeof createFridayRequestSchema>;
