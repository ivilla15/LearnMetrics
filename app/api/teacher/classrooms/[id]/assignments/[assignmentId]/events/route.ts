import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth';
import { assertTeacherOwnsClassroom } from '@/core';
import { handleApiError, type RouteContext } from '@/app/api/_shared';
import { errorResponse, jsonResponse, parseId } from '@/utils';

type Ctx = RouteContext<{ id: string; assignmentId: string }>;

export async function GET(req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId } = await params;
    const classroomId = parseId(id);
    const aid = parseId(assignmentId);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);
    if (!aid) return errorResponse('Invalid assignment id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const assignment = await prisma.assignment.findFirst({
      where: { id: aid, classroomId },
      select: { id: true },
    });
    if (!assignment) return errorResponse('Assignment not found', 404);

    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get('studentId');
    const studentId = studentIdParam ? parseInt(studentIdParam, 10) : null;

    const events = await prisma.attemptEvent.findMany({
      where: {
        assignmentId: aid,
        ...(studentId && Number.isFinite(studentId) ? { studentId } : {}),
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: 200,
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        Student: { select: { id: true, name: true, username: true } },
      },
    });

    return jsonResponse(
      {
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          occurredAt: e.occurredAt.toISOString(),
          student: { id: e.Student.id, name: e.Student.name, username: e.Student.username },
        })),
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
