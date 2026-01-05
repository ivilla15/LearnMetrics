import { getStudentHistory } from '@/core/students/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { requireStudent } from '@/core/auth/requireStudent';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return errorResponse('Invalid student id', 400);
    }

    // Teacher OR the student themself
    const teacherAuth = await requireTeacher();
    if (!teacherAuth.ok) {
      const studentAuth = await requireStudent();
      if (!studentAuth.ok) return errorResponse(studentAuth.error, studentAuth.status);

      if (studentAuth.student.id !== studentId) {
        return errorResponse('You are not allowed to view this student', 403);
      }
    }

    const history = await getStudentHistory(studentId);
    return jsonResponse(history, 200);
  } catch (err) {
    if (err instanceof ConflictError) return errorResponse(err.message, 403);
    if (err instanceof NotFoundError) return errorResponse(err.message, 404);
    return errorResponse('Internal server error', 500);
  }
}
