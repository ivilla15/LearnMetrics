import { getLatestAssignmentForClassroom } from '@/core/assignments/service';
import { requireTeacher, AuthError } from '@/core/auth';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError } from '@/core/errors';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const teacher = await requireTeacher(request);

    const { id } = await context.params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    // Optional: you could verify teacher owns the classroom here
    const latest = await getLatestAssignmentForClassroom(classroomId);

    return jsonResponse({ latest }, 200);
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
