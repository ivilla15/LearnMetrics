import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';
import { jsonResponse, errorResponse } from '@/utils/http';
import { parseId } from '@/utils/parse';
import { handleApiError, type RouteContext } from '@/app/api/_shared';
import { z } from 'zod';

const bodySchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  score: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(1),
});

type Params = { id: string };

export async function POST(req: Request, { params }: RouteContext<Params>) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return errorResponse('Invalid assignment id', 400);

    const parsed = bodySchema.parse(await req.json().catch(() => null));

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { targetKind: true, minimumScorePercent: true },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);
    if (assignment.targetKind !== 'PRACTICE_TIME') {
      return errorResponse('Not a practice-time assignment', 409);
    }

    const threshold = assignment.minimumScorePercent ?? 80;
    const scorePercent = parsed.total > 0
      ? Math.round((parsed.score / parsed.total) * 100)
      : 0;
    const qualified = scorePercent >= threshold;

    const ended = await prisma.practiceSession.updateMany({
      where: {
        id: parsed.sessionId,
        studentId: auth.student.id,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
        score: parsed.score,
        total: parsed.total,
        qualified,
      },
    });

    if (ended.count === 0) {
      return errorResponse('Session not found or already ended', 404);
    }

    return jsonResponse({ ok: true, qualified, scorePercent }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Failed to end practice session' });
  }
}
