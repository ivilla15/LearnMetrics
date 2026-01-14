import { getRosterWithLastAttempt, requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { RouteContext, handleApiError } from '@/app';

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    // 0) Auth (cookie + TeacherSession)
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Validate params
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 2) Service call must enforce ownership using teacherId
    const roster = await getRosterWithLastAttempt({
      classroomId,
      teacherId: auth.teacher.id,
    });

    return jsonResponse(roster, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('GET /api/classrooms/[id]/roster error', message, err);

    if (
      err instanceof Error &&
      err.message.includes('prepared statement') &&
      process.env.NODE_ENV === 'development'
    ) {
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

    return handleApiError(err, {
      defaultMessage: 'Internal server error',
      defaultStatus: 500,
    });
  }
}
