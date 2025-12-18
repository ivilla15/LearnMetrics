import { getLatestAssignmentForClassroom } from '@/core/assignments/service';
import { requireTeacher, AuthError } from '@/core/auth';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError } from '@/core/errors';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireTeacher(request); // dev stub, no Prisma

    const { id } = await context.params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    const latest = await getLatestAssignmentForClassroom(classroomId);

    return jsonResponse({ latest }, 200);
  } catch (err: any) {
    console.error('GET /api/classrooms/[id]/latest-assignment error', err);

    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (typeof err?.message === 'string' && err.message.includes('prepared statement')) {
      return jsonResponse(
        {
          latest: null,
          warning:
            'Latest assignment temporarily unavailable (pooler/prepared-statement issue in dev).',
        },
        200,
      );
    }

    return errorResponse('Internal server error', 500);
  }
}
