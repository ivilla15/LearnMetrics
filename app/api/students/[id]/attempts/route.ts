import { getStudentHistory } from '@/core/students/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { requireTeacher, requireStudent, AuthError } from '@/core/auth';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return errorResponse('Invalid student id', 400);
    }

    // For now, let teachers view any student, and students only view their own id
    let viewer;
    try {
      viewer = await requireTeacher(request);
    } catch {
      const s = await requireStudent(request);
      if (s.id !== studentId) {
        throw new ConflictError('You are not allowed to view this student');
      }
      viewer = s;
    }

    const history = await getStudentHistory(studentId);
    return jsonResponse(history, 200);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }
    if (err instanceof ConflictError) {
      return errorResponse(err.message, 403);
    }
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }
    return errorResponse('Internal server error', 500);
  }
}
