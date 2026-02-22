import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { errorResponse, jsonResponse, parseAttemptsFilter, parseId, percent } from '@/utils';
import { handleApiError, type RouteContext } from '@/app';

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId } = await params;

    const classroomId = parseId(id);
    const aid = parseId(assignmentId);

    if (!classroomId) return errorResponse('Invalid classroom id', 400);
    if (!aid) return errorResponse('Invalid assignment id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const url = new URL(req.url);
    const filter = parseAttemptsFilter(url.searchParams.get('filter'));

    const assignment = await prisma.assignment.findUnique({
      where: { id: aid },
      select: {
        id: true,
        classroomId: true,
        type: true,
        mode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);
    if (assignment.classroomId !== classroomId) return errorResponse('Assignment not found', 404);

    const targetedIds = assignment.recipients.map((r) => r.studentId);

    const expectedStudents =
      targetedIds.length > 0
        ? await prisma.student.findMany({
            where: { id: { in: targetedIds }, classroomId },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: { id: true, name: true, username: true },
          })
        : await prisma.student.findMany({
            where: { classroomId },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            select: { id: true, name: true, username: true },
          });

    const attempts = await prisma.attempt.findMany({
      where: { assignmentId: aid },
      select: {
        id: true,
        studentId: true,
        completedAt: true,
        score: true,
        total: true,
        levelAtTime: true,
      },
    });

    const attemptByStudent = new Map<number, (typeof attempts)[number]>();
    for (const a of attempts) attemptByStudent.set(a.studentId, a);

    let rows = expectedStudents.map((s) => {
      const a = attemptByStudent.get(s.id) ?? null;
      const p = a ? percent(a.score, a.total) : null;
      const missed = a ? Math.max(0, a.total - a.score) : null;
      const wasMastery = a ? a.total > 0 && a.score === a.total : null;

      return {
        studentId: s.id,
        name: s.name,
        username: s.username,
        attemptId: a?.id ?? null,
        completedAt: a?.completedAt ? a.completedAt.toISOString() : null,
        score: a?.score ?? null,
        total: a?.total ?? null,
        percent: p,
        missed,
        wasMastery,
        levelAtTime: a?.levelAtTime ?? null,
      };
    });

    if (filter === 'MISSING') {
      rows = rows.filter((r) => r.attemptId === null);
    } else if (filter === 'MASTERY') {
      rows = rows.filter((r) => r.wasMastery === true);
    } else if (filter === 'NOT_MASTERY') {
      rows = rows.filter((r) => r.attemptId !== null && r.wasMastery === false);
    }

    return jsonResponse(
      {
        assignment: {
          assignmentId: assignment.id,
          type: assignment.type,
          mode: assignment.mode,
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
          windowMinutes: assignment.windowMinutes,
          numQuestions: assignment.numQuestions ?? 12,
          isTargeted: targetedIds.length > 0,
          recipientCount: targetedIds.length,
        },
        rows,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
