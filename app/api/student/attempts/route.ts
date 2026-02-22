import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { handleApiError } from '@/app/api/_shared';
import { jsonResponse, errorResponse, percent, parseCursor } from '@/utils';
import type { AttemptRowDTO, AttemptExplorerFilter, OperationCode } from '@/types';
import { studentAttemptsQuerySchema } from '@/validation';

export async function GET(req: Request) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const url = new URL(req.url);
    const parsed = studentAttemptsQuerySchema.parse({
      cursor: url.searchParams.get('cursor') ?? undefined,
      filter: url.searchParams.get('filter') ?? undefined,
    });

    const cursor = parseCursor(parsed.cursor ?? null);
    const filter: AttemptExplorerFilter = parsed.filter;

    const limit = 10;
    const take = limit * 5 + 1;

    const rows = await prisma.attempt.findMany({
      where: { studentId: auth.student.id },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        assignmentId: true,
        score: true,
        total: true,
        completedAt: true,
        operationAtTime: true,
        levelAtTime: true,
        Assignment: { select: { type: true, mode: true } },
      },
    });

    const mapped: AttemptRowDTO[] = rows
      .filter((a) => a.completedAt !== null)
      .map((a) => {
        const pct = percent(a.score, a.total);
        const wasMastery = a.total > 0 && a.score === a.total;

        const op = (a.operationAtTime ?? 'MUL') as OperationCode;
        const lvl = a.levelAtTime ?? 1;

        return {
          attemptId: a.id,
          assignmentId: a.assignmentId,
          completedAt: a.completedAt!.toISOString(),
          type: a.Assignment.type,
          mode: a.Assignment.mode,
          operation: op,
          levelAtTime: lvl,
          score: a.score,
          total: a.total,
          percent: pct,
          wasMastery,
        };
      });

    let filtered: AttemptRowDTO[] = mapped;
    if (filter === 'MASTERY') filtered = mapped.filter((r) => r.wasMastery);
    if (filter === 'NOT_MASTERY') filtered = mapped.filter((r) => !r.wasMastery);

    const page = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;
    const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1].attemptId) : null;

    return jsonResponse({ rows: page, nextCursor }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
