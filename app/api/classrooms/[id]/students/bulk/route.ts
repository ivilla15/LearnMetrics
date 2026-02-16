import { bulkCreateClassroomStudents, requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { z } from 'zod';
import { BulkStudentInput, operationSchema } from '@/types';

const bulkStudentsSchema = z.object({
  defaultStartingOperation: operationSchema.optional(),
  defaultStartingLevel: z.number().int().min(1).max(100).optional(),

  defaultLevel: z.number().int().min(1).max(100).optional(),

  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(1),

        level: z.number().int().min(1).max(100).optional(),

        startingOperation: operationSchema.optional(),
        startingLevel: z.number().int().min(1).max(100).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const parsed = bulkStudentsSchema.parse(body);

    const defaultStartingOperation = parsed.defaultStartingOperation;
    const defaultStartingLevel = parsed.defaultStartingLevel;
    const defaultLevel = parsed.defaultLevel ?? 1;

    const studentsToCreate = parsed.students.map<BulkStudentInput>((s) => {
      const resolvedLevel = s.level ?? s.startingLevel ?? defaultStartingLevel ?? defaultLevel;
      const op = s.startingOperation ?? defaultStartingOperation;

      return {
        firstName: s.firstName,
        lastName: s.lastName,
        username: s.username,
        level: resolvedLevel,
        startingOperation: op,
        startingLevel: s.startingLevel ?? (op ? resolvedLevel : defaultStartingLevel),
      };
    });

    const result = await bulkCreateClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      students: studentsToCreate,
    });

    return jsonResponse(result, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
