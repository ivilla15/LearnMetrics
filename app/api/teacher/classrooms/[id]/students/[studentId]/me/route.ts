import { getTeacherClassroomStudentParams, RouteContext, handleApiError } from '@/app/api/_shared';
import * as StudentsRepo from '@/data/students.repo';
import { jsonResponse, errorResponse } from '@/utils/http';

export async function GET(
  _req: Request,
  { params }: RouteContext<{ id: string; studentId: string }>,
) {
  try {
    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const student = await StudentsRepo.findStudentByIdInClassroom(
      ctx.classroomId,
      ctx.studentIdNum,
    );
    if (!student) return errorResponse('Student not found in classroom', 404);

    return jsonResponse(
      {
        studentId: student.id,
        name: student.name,
        username: student.username,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
