import { getRosterWithLastAttempt, requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { RouteContext, handleApiError } from '@/app';
import { prisma } from '@/data/prisma';
import z from 'zod';

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    // 0) Auth
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Validate params
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 2) Load roster (ownership enforced in service)
    const roster = await getRosterWithLastAttempt({
      classroomId,
      teacherId: auth.teacher.id,
    });

    // 3) Load classroom timezone (single scalar lookup)
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { timeZone: true },
    });

    // 4) Attach timezone safely
    const response = {
      ...roster,
      classroom: {
        ...roster.classroom,
        timeZone: classroom?.timeZone ?? 'America/Los_Angeles',
      },
    };

    return jsonResponse(response, 200);
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
          classroom: {
            id: classroomId,
            name: z.string().trim().min(1).max(80),
            timeZone: z.string().optional(),
          },
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
