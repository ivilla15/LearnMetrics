// app/api/student/attempts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth/requireStudent';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseCursor(raw: string | null) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const student = auth.student;

  const url = new URL(req.url);
  const cursor = parseCursor(url.searchParams.get('cursor'));
  const filter = (url.searchParams.get('filter') ?? 'ALL').toUpperCase();

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
      Assignment: { select: { kind: true, assignmentMode: true } },
    },
  });

  const mapped = rows.map((a) => {
    const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
    const wasMastery = a.total > 0 && a.score === a.total;

    return {
      attemptId: a.id,
      assignmentId: a.assignmentId,
      completedAt: a.completedAt.toISOString(),
      assignmentKind: a.Assignment.kind,
      assignmentMode: a.Assignment.assignmentMode,
      levelAtTime: a.levelAtTime ?? student.level,
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

  // Cursor based on the LAST raw row we scanned (good enough for MVP)
  const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].id) : null;

  return NextResponse.json({ rows: page, nextCursor }, { status: 200 });
}
