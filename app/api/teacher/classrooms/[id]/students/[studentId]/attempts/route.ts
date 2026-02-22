import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { handleApiError, RouteContext } from '@/app/api/_shared/';
import { jsonResponse, errorResponse, parseCursor, percent } from '@/utils';
import {
  classroomIdParamSchema,
  studentIdParamSchema,
  studentAttemptsQuerySchema,
} from '@/validation';
import type { AttemptRowDTO, AttemptExplorerFilter, OperationCode } from '@/types';

export async function GET(req: Request, context: RouteContext<{ id: string; studentId: string }>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const exists = await prisma.student.findFirst({
      where: { id: sid, classroomId },
      select: { id: true },
    });
    if (!exists) return errorResponse('Student not found', 404);

    const url = new URL(req.url);
    const parsed = studentAttemptsQuerySchema.parse({
      cursor: url.searchParams.get('cursor') ?? undefined,
      filter: url.searchParams.get('filter') ?? undefined,
    });

    const cursor = parseCursor(parsed.cursor ?? null);
    const filter: AttemptExplorerFilter = parsed.filter;

    const limit = 10;
    const take = limit * 5 + 1; // overfetch so filtering doesn’t empty pages

    const rows = await prisma.attempt.findMany({
      where: { studentId: sid },
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

        if (!a.operationAtTime || a.levelAtTime == null) {
          throw new Error('Attempt snapshot missing operationAtTime/levelAtTime');
        }

        const op = a.operationAtTime as OperationCode;
        const lvl = a.levelAtTime;

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
