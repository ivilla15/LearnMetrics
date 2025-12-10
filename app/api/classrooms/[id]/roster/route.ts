import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError } from '@/core/errors';
import { requireTeacher, AuthError } from '@/core/auth';
import * as ClassroomsRepo from '@/data/classrooms.repo';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // 0) Auth
    const teacher = await requireTeacher(request);

    const { id } = await context.params;

    const classroomId = Number(id);
    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    // 1) Ownership check: teacher must own the classroom
    const classroom = await ClassroomsRepo.findClassroomById(classroomId);

    if (!classroom) {
      return errorResponse('Classroom not found', 404);
    }

    if (classroom.teacherId !== teacher.id) {
      return errorResponse('You are not allowed to view this classroom', 403);
    }

    // 2) Business logic
    const roster = await getRosterWithLastAttempt(classroomId);
    return jsonResponse(roster, 200);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }

    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    return errorResponse('Internal server error', 500);
  }
}
