import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';
import { jsonResponse } from '@/utils/http';
import { handleApiError } from '@/app/api/_shared';
import { z } from 'zod';

const bodySchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  deltaSeconds: z.coerce.number().int().min(1).max(60),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

    const { id } = await ctx.params;
    const assignmentId = Number(id);
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      return jsonResponse({ error: 'Invalid assignment id' }, 400);
    }

    const parsed = bodySchema.parse(await req.json().catch(() => null));

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { targetKind: true, opensAt: true, closesAt: true },
    });

    if (!assignment) return jsonResponse({ error: 'Assignment not found' }, 404);
    if (assignment.targetKind !== 'PRACTICE_TIME') {
      return jsonResponse({ error: 'Not a practice-time assignment' }, 409);
    }

    const now = new Date();
    if (now < assignment.opensAt) return jsonResponse({ error: 'Assignment not open yet' }, 409);
    if (assignment.closesAt && now > assignment.closesAt) {
      return jsonResponse({ error: 'Assignment window closed' }, 409);
    }

    const updated = await prisma.practiceSession.updateMany({
      where: {
        id: parsed.sessionId,
        studentId: auth.student.id,
        endedAt: null,
      },
      data: {
        durationSeconds: { increment: parsed.deltaSeconds },
      },
    });

    if (updated.count === 0) {
      return jsonResponse({ error: 'Session not found or already ended' }, 404);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Failed to update practice session' });
  }
}
