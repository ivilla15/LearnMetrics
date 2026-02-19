import { requireTeacher } from '@/core';
import * as StudentsRepo from '@/data/students.repo';
import { jsonError } from '@/utils';
import { handleApiError, type ClassroomStudentRouteContext } from '@/app';

import { getTeacherClassroomAndStudentId } from '@/app/api/_shared/teacherStudentParams';

export async function GET(_req: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const ctx = await getTeacherClassroomAndStudentId(params);
    if (!ctx.ok) return ctx.response;

    const student = await StudentsRepo.findStudentByIdInClassroom(
      ctx.classroomId,
      ctx.studentIdNum,
    );
    if (!student) return jsonError('Student not found in classroom', 404);

    return new Response(
      JSON.stringify({ studentId: student.id, name: student.name, username: student.username }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
