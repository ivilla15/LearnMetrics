import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';
import { jsonResponse } from '@/utils/http';
import { handleApiError, type RouteContext } from '@/app/api/_shared';
import { z } from 'zod';
import { getStatus } from '@/utils';

const bodySchema = z.object({
  operation: z.enum(['ADD', 'SUB', 'MUL', 'DIV']).optional(),
  level: z.coerce.number().int().min(1).max(12).optional(),
  maxNumber: z.coerce.number().int().min(1).max(100).optional(),
});

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
type Params = { id: string };

export async function POST(req: Request, { params }: RouteContext<Params>) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

    const { id } = await params;
    const assignmentId = Number(id);
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      return jsonResponse({ error: 'Invalid assignment id' }, 400);
    }

    const student = auth.student;
    const parsed = bodySchema.parse(await req.json().catch(() => null));

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
    if (!canAccessAssignment({ assignment, student })) {
      return jsonResponse({ error: 'Not allowed' }, 403);
    }

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

    // Prefer explicit assignment.operation if set, otherwise accept client payload, otherwise MUL
    const operationAtTime = assignment.operation ?? parsed.operation ?? 'MUL';

    // For now we accept the client’s chosen level/maxNumber (bounded),
    // because practice setup page is where that choice happens.
    // If you later want “exactly what assignments use”, we’ll swap this to a server-derived snapshot.
    const levelAtTime = parsed.level ?? 1;
    const maxNumberAtTime = parsed.maxNumber ?? 12;

    const session = await prisma.practiceSession.create({
      data: {
        studentId: student.id,
        startedAt: new Date(),
        endedAt: null,
        durationSeconds: 0,
        operationAtTime,
        levelAtTime,
        maxNumberAtTime,
      },
      select: { id: true },
    });

    return jsonResponse({ sessionId: session.id }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Failed to start practice session' });
  }
}
