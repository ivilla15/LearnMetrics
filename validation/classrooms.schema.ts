import z from 'zod';

export const classroomIdParamSchema = z.object({
  id: z.string().min(1, 'classroom id required'),
});
export type ClassroomIdParams = z.infer<typeof classroomIdParamSchema>;
