// src/validation/classrooms.schema.ts
import { z } from 'zod';

export const classroomIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type ClassroomIdParam = z.infer<typeof classroomIdParamSchema>;
export const createClassroomSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateClassroom = z.infer<typeof createClassroomSchema>;
