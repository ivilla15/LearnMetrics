import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';
import { studentCanAccessAssignment } from '@/core/assignments';
import { jsonResponse, errorResponse } from '@/utils/http';
import { parseId, getStatus } from '@/utils';
import { handleApiError, type RouteContext } from '@/app/api/_shared';
import { z } from 'zod';

const bodySchema = z.object({
  operation: z.enum(['ADD', 'SUB', 'MUL', 'DIV']).optional(),
  level: z.coerce.number().int().min(1).max(12).optional(),
  maxNumber: z.coerce.number().int().min(1).max(100).optional(),
});

type Params = { id: string };

export async function POST(req: Request, { params }: RouteContext<Params>) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return errorResponse('Invalid assignment id', 400);

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
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);
    if (!studentCanAccessAssignment({ assignment, student })) {
      return errorResponse('Not allowed', 403);
    }

    if (assignment.targetKind !== 'PRACTICE_TIME') {
      return errorResponse('Not a practice-time assignment', 409);
    }

    const status = getStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now: new Date(),
    });
    if (status === 'NOT_OPEN') return errorResponse('Assignment not open yet', 409);
    if (status === 'CLOSED') return errorResponse('Assignment window closed', 409);

    // Accept client's operation choice (from progression snapshot on practice setup page)
    const operationAtTime = parsed.operation ?? 'MUL';

    // For now we accept the client’s chosen level/maxNumber (bounded),
    // because practice setup page is where that choice happens.
    // If you later want “exactly what assignments use”, we’ll swap this to a server-derived snapshot.
    const levelAtTime = parsed.level ?? 1;
    const maxNumberAtTime = parsed.maxNumber ?? 12;

    const session = await prisma.practiceSession.create({
      data: {
        studentId: student.id,
        assignmentId,
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
