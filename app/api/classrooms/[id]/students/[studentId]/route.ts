import {
  requireTeacher,
  updateClassroomStudentById,
  deleteClassroomStudentById,
  getOrCreateClassroomPolicy,
  setTeacherStudentProgressRows,
} from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, ClassroomStudentRouteContext, readJson } from '@/app';
import { z } from 'zod';

const updateStudentSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  level: z.number().int().min(1).max(100),
});

async function getTeacherClassroomAndStudentId(params: ClassroomStudentRouteContext['params']) {
  const auth = await requireTeacher();
  if (!auth.ok) return { ok: false as const, response: errorResponse(auth.error, auth.status) };

  const { id, studentId } = await params;
  const { id: classroomId } = classroomIdParamSchema.parse({ id });

  const studentIdNum = Number(studentId);
  if (!Number.isFinite(studentIdNum) || studentIdNum <= 0) {
    return { ok: false as const, response: errorResponse('Invalid student id', 400) };
  }

  return { ok: true as const, teacher: auth.teacher, classroomId, studentIdNum };
}

export async function PATCH(request: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = updateStudentSchema.parse(body);

    const policy = await getOrCreateClassroomPolicy({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
    });

    const primaryOp = policy.operationOrder[0] ?? policy.enabledOperations[0];

    const student = await updateClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
      input: { name: input.name, username: input.username },
    });

    if (primaryOp) {
      await setTeacherStudentProgressRows({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentIdNum,
        levels: [{ operation: primaryOp, level: input.level }],
      });
    }

    return jsonResponse({ student }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
    if (!ctx.ok) return ctx.response;

    await deleteClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
    });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
