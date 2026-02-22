import { z } from 'zod';

import { requireTeacher, bulkCreateClassroomStudents } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { bulkAddStudentsSchema } from '@/validation/teacher/bulk-students';

import { errorResponse, jsonResponse } from '@/utils/http';
import { handleApiError, readJson, type RouteContext } from '@/app';

import type { OperationCode } from '@/types/enums';
import type { BulkAddStudentInputDTO } from '@/types/api/teacherStudents';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const parsed = bulkAddStudentsSchema.parse(body);

    const defaultStartingOperation = parsed.defaultStartingOperation;
    const defaultStartingLevel = parsed.defaultStartingLevel;
    const defaultLevel = parsed.defaultLevel ?? 1;

    const studentsToCreate: BulkAddStudentInputDTO[] = parsed.students.map((s) => {
      const resolvedLevel = s.startingLevel ?? s.level ?? defaultStartingLevel ?? defaultLevel;

      const resolvedOp: OperationCode | undefined = s.startingOperation ?? defaultStartingOperation;

      return {
        firstName: s.firstName,
        lastName: s.lastName,
        username: s.username,
        startingOperation: resolvedOp,
        startingLevel: resolvedLevel,
      };
    });

    const result = await bulkCreateClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      students: studentsToCreate,
    });

    return jsonResponse(result, 201);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return errorResponse('Invalid request body', 400);
    return handleApiError(err);
  }
}
