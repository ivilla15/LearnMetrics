import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError } from '@/core/errors';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // Next 15: params is a Promise, so await it
    const { id } = await context.params;

    // Basic manual validation / coercion
    const classroomId = Number(id);
    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    const roster = await getRosterWithLastAttempt(classroomId);

    // 4) Return success
    return jsonResponse(roster, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    return errorResponse('Internal server error', 500);

    return errorResponse('Internal server error', 500);
  }
}
