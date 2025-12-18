import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';
import { NotFoundError } from '@/core/errors';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const roster = await getRosterWithLastAttempt(classroomId);
    return jsonResponse(roster, 200);
  } catch (err: any) {
    console.error('GET /api/classrooms/[id]/roster error', err);

    if (err instanceof ZodError) {
      return errorResponse('Invalid classroom id', 400);
    }
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (typeof err?.message === 'string' && err.message.includes('prepared statement')) {
      const { id } = await context.params;
      const classroomId = Number(id);

      return jsonResponse(
        {
          classroom: {
            id: classroomId,
            name: 'Unavailable (dev)',
          },
          students: [],
          warning: 'Roster temporarily unavailable (pooler/prepared-statement issue in dev).',
        },
        200,
      );
    }

    return errorResponse('Internal server error', 500);
  }
}
