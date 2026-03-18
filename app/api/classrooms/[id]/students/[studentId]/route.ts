import {
  requireTeacher,
  updateClassroomStudentById,
  deleteClassroomStudentById,
  getOrCreateClassroomPolicy,
  setTeacherStudentProgressRows,
} from '@/core';

import {
  classroomStudentParamsSchema,
  updateStudentSchema,
} from '@/validation/teacher/classroom-student';

import { jsonResponse, errorResponse } from '@/utils/http';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { OPERATION_CODES, type OperationCode } from '@/types/enums';

type ClassroomStudentParams = {
  id: string;
  studentId: string;
};

function coercePrimaryOperation(raw: unknown): OperationCode {
  if (typeof raw === 'string' && (OPERATION_CODES as readonly string[]).includes(raw)) {
    return raw as OperationCode;
  }
  return 'MUL';
}

async function getTeacherClassroomAndStudentId(
  params: RouteContext<ClassroomStudentParams>['params'],
) {
  const auth = await requireTeacher();
  if (!auth.ok) return { ok: false as const, response: errorResponse(auth.error, auth.status) };

  const { id, studentId } = await params;
  const parsed = classroomStudentParamsSchema.parse({ id, studentId });

  return {
    ok: true as const,
    teacher: auth.teacher,
    classroomId: parsed.id,
    studentId: parsed.studentId,
  };
}

export async function PATCH(request: Request, { params }: RouteContext<ClassroomStudentParams>) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = updateStudentSchema.parse(body);

    const policy = await getOrCreateClassroomPolicy({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
    });

    // Prisma enums → safely coerced OperationCode
    const primaryRaw = policy.operationOrder[0] ?? policy.enabledOperations[0] ?? null;
    const primaryOp = coercePrimaryOperation(primaryRaw);

    const student = await updateClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentId,
      input: { name: input.name, username: input.username },
    });

    // Update StudentProgress for the primary operation
    await setTeacherStudentProgressRows({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentId,
      levels: [{ operation: primaryOp, level: input.level }],
    });

    return jsonResponse({ student } as const, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<ClassroomStudentParams>) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
    if (!ctx.ok) return ctx.response;

    await deleteClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentId,
    });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
