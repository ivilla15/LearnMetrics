import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { jsonError, parseId, parseCursor } from '@/utils';
import { handleApiError } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

type RouteCtx = { params: Promise<{ id: string; studentId: string }> };

export async function GET(req: Request, { params }: RouteCtx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const { id, studentId } = await params;

    const classroomId = parseId(id);
    if (!classroomId) return jsonError('Invalid classroom id', 400);

    const sid = parseId(studentId);
    if (!sid) return jsonError('Invalid student id', 400);

    const url = new URL(req.url);
    const cursor = parseCursor(url.searchParams.get('cursor'));
    const filter = (url.searchParams.get('filter') ?? 'ALL').toUpperCase();

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    // Ensure student belongs to classroom (and grab level for fallback)
    const student = await prisma.student.findFirst({
      where: { id: sid, classroomId },
      select: { id: true },
    });
    if (!student) return jsonError('Student not found', 404);

    const limit = 10;
    const take = limit * 5 + 1; // overfetch so filtering doesn’t empty pages

    const rows = await prisma.attempt.findMany({
      where: { studentId: student.id },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        assignmentId: true,
        score: true,
        total: true,
        completedAt: true,
        levelAtTime: true,
        Assignment: { select: { type: true, mode: true } },
      },
    });

    const mapped = rows
      .filter((a) => a.completedAt)
      .map((a) => {
        const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
        const wasMastery = a.total > 0 && a.score === a.total;

        return {
          attemptId: a.id,
          assignmentId: a.assignmentId,
          completedAt: a.completedAt ? a.completedAt.toISOString() : null,
          type: a.Assignment.type,
          mode: a.Assignment.mode,
          score: a.score,
          total: a.total,
          percent,
          wasMastery,
        };
      });

    const filtered =
      filter === 'MASTERY'
        ? mapped.filter((r) => r.wasMastery)
        : filter === 'NOT_MASTERY'
          ? mapped.filter((r) => !r.wasMastery)
          : mapped;

    const page = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    // Cursor based on the LAST raw row we scanned
    const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].id) : null;

    return NextResponse.json({ rows: page, nextCursor }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
