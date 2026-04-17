import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { handleApiError, RouteContext } from '@/app/api/_shared/';
import { jsonResponse, errorResponse, parseId } from '@/utils';

type Ctx = RouteContext<{ id: string }>;

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const assignmentIds = await prisma.assignment
      .findMany({ where: { classroomId }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));

    if (assignmentIds.length === 0) {
      return jsonResponse({ withEvents: 0, flagged: 0, invalidated: 0 }, 200);
    }

    const [flagged, invalidated, eventPairs] = await Promise.all([
      prisma.attempt.count({
        where: { assignmentId: { in: assignmentIds }, reviewStatus: 'FLAGGED' },
      }),
      prisma.attempt.count({
        where: { assignmentId: { in: assignmentIds }, reviewStatus: 'INVALIDATED' },
      }),
      prisma.attemptEvent
        .groupBy({
          by: ['studentId', 'assignmentId'],
          where: { assignmentId: { in: assignmentIds } },
        })
        .then((g) => g.length),
    ]);

    return jsonResponse({ withEvents: eventPairs, flagged, invalidated }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
