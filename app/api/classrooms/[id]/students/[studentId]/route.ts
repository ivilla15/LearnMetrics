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

type ClassroomStudentParams = {
  id: string;
  studentId: string;
};

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

    const student = await updateClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentId,
      input: { name: input.name, username: input.username },
    });

    if (input.level !== undefined) {
      const primaryDomain = policy.enabledDomains[0] ?? 'MUL_WHOLE';
      await setTeacherStudentProgressRows({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentId,
        levels: [{ domain: primaryDomain, level: input.level }],
      });
    }

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
