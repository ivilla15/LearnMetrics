import z from 'zod';

export const classroomIdParamSchema = z.object({
  id: z.number().min(1, 'classroom id required'),
});
export type ClassroomIdParams = z.infer<typeof classroomIdParamSchema>;
