import { z } from 'zod';

export const classroomStudentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  level: z.number().int().min(1).max(100),
});
