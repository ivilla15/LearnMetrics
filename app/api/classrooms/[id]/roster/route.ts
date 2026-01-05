import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';
import { NotFoundError, ConflictError } from '@/core/errors';
import { requireTeacher } from '@/core/auth/requireTeacher'; // adjust to your actual path

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    // 0) Auth (cookie + TeacherSession)
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Validate params
    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 2) Service call must enforce ownership using teacherId
    const roster = await getRosterWithLastAttempt({
      classroomId,
      teacherId: auth.teacher.id,
    });

    return jsonResponse(roster, 200);
  } catch (err: any) {
    console.error('GET /api/classrooms/[id]/roster error', err);

    if (err instanceof ZodError) {
      return errorResponse('Invalid classroom id', 400);
    }
    if (err instanceof ConflictError) {
      return errorResponse(err.message, 403);
    }
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (typeof err?.message === 'string' && err.message.includes('prepared statement')) {
      const { id } = await context.params;
      const classroomId = Number(id);

      return jsonResponse(
        {
          classroom: { id: classroomId, name: 'Unavailable (dev)' },
          students: [],
          warning: 'Roster temporarily unavailable (pooler/prepared-statement issue in dev).',
        },
        200,
      );
    }

    return errorResponse('Internal server error', 500);
  }
}
