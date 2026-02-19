import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { jsonError, parseCursor } from '@/utils';
import { handleApiError } from '@/app';

type Filter = 'ALL' | 'MASTERY' | 'NOT_MASTERY';

function parseFilter(value: string | null): Filter {
  const v = (value ?? 'ALL').toUpperCase();
  if (v === 'MASTERY') return 'MASTERY';
  if (v === 'NOT_MASTERY') return 'NOT_MASTERY';
  return 'ALL';
}

export async function GET(req: Request) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonError(auth.error, auth.status);
    const student = auth.student;

    const url = new URL(req.url);
    const cursor = parseCursor(url.searchParams.get('cursor'));
    const filter = parseFilter(url.searchParams.get('filter'));

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
      .filter((a) => a.completedAt) // only include completed attempts
      .map((a) => {
        const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
        const wasMastery = a.total > 0 && a.score === a.total;

        // Defensive: Assignment should exist, but guard just in case.
        const assignmentType = a.Assignment ? a.Assignment.type : null;
        const assignmentMode = a.Assignment ? a.Assignment.mode : null;

        return {
          attemptId: a.id,
          assignmentId: a.assignmentId,
          completedAt: a.completedAt!.toISOString(),
          assignmentType,
          assignmentMode,
          // do NOT fall back to current student level; return null if missing
          levelAtTime: a.levelAtTime ?? null,
          score: a.score,
          total: a.total,
          percent,
          wasMastery,
        };
      });

    let filtered = mapped;
    if (filter === 'MASTERY') filtered = mapped.filter((r) => r.wasMastery);
    if (filter === 'NOT_MASTERY') filtered = mapped.filter((r) => !r.wasMastery);

    const page = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1].attemptId) : null;

    return NextResponse.json({ rows: page, nextCursor }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
