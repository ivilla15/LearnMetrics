import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';
import { jsonResponse } from '@/utils/http';
import { handleApiError } from '@/app/api/_shared';

function canAccessAssignment(params: {
  assignment: { classroomId: number; recipients: Array<{ studentId: number }> };
  student: { id: number; classroomId: number };
}) {
  const { assignment, student } = params;
  if (assignment.classroomId !== student.classroomId) return false;

  const targeted = assignment.recipients.length > 0;
  if (!targeted) return true;

  return assignment.recipients.some((r) => r.studentId === student.id);
}

function getStatus(params: { opensAt: Date; closesAt: Date | null; now: Date }) {
  const { opensAt, closesAt, now } = params;
  if (now < opensAt) return 'NOT_OPEN' as const;
  if (closesAt && now > closesAt) return 'CLOSED' as const;
  return 'OPEN' as const;
}

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

    const { id } = await ctx.params;
    const assignmentId = Number(id);
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      return jsonResponse({ error: 'Invalid assignment id' }, 400);
    }

    const student = auth.student;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        classroomId: true,
        targetKind: true,
        opensAt: true,
        closesAt: true,
        operation: true,
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return jsonResponse({ error: 'Assignment not found' }, 404);
    if (!canAccessAssignment({ assignment, student }))
      return jsonResponse({ error: 'Not allowed' }, 403);

    if (assignment.targetKind !== 'PRACTICE_TIME') {
      return jsonResponse({ error: 'Not a practice-time assignment' }, 409);
    }

    const status = getStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now: new Date(),
    });
    if (status === 'NOT_OPEN') return jsonResponse({ error: 'Assignment not open yet' }, 409);
    if (status === 'CLOSED') return jsonResponse({ error: 'Assignment window closed' }, 409);

    const session = await prisma.practiceSession.create({
      data: {
        studentId: student.id,
        startedAt: new Date(),
        endedAt: null,
        durationSeconds: 0,
        operationAtTime: assignment.operation ?? 'MUL',
        levelAtTime: 1,
        maxNumberAtTime: 12,
      },
      select: { id: true },
    });

    return jsonResponse({ sessionId: session.id }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Failed to start practice session' });
  }
}
