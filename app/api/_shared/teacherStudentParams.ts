import { requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse } from '@/utils';
import type { ClassroomStudentRouteContext } from '@/app';

export async function getTeacherClassroomAndStudentId(
  params: ClassroomStudentRouteContext['params'],
) {
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
