import z from 'zod';

// Defines the shape of the POST body for create-friday.
export const createFridayRequestSchema = z.object({
  classroomId: z.string().min(1, 'classroomId required'),
  fridayDate: z.string().optional(), // "YYYY-MM-DD"
  opensAtLocalTime: z.string().optional(), // "HH:mm"
  windowMinutes: z.number().min(1).max(10).optional(),
});
export type CreateFridayRequest = z.infer<typeof createFridayRequestSchema>;

export const classroomIdParamSchema = z.object({
  id: z.string().min(1, 'classroom id required'),
});
