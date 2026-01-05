import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseId(raw: string | null | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type RouteCtx = {
  params: Promise<{ id: string; studentId: string }>;
};

export async function GET(req: Request, { params }: RouteCtx) {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const teacher = auth.teacher;

  const { id: rawClassroomId, studentId: rawStudentId } = await params;
  const classroomId = parseId(rawClassroomId);
  const studentId = parseId(rawStudentId);
  if (!classroomId) return jsonError('Invalid classroom id', 400);
  if (!studentId) return jsonError('Invalid student id', 400);

  // Authorization: teacher must own the classroom
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: teacher.id },
    select: { id: true },
  });
  if (!classroom) return jsonError('Not allowed', 403);

  // Authorization: student must belong to this classroom
  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId },
    select: { id: true, level: true },
  });
  if (!student) return jsonError('Student not found', 404);

  const url = new URL(req.url);

  const cursorRaw = url.searchParams.get('cursor');
  const cursor = cursorRaw ? parseId(cursorRaw) : null;

  const masteryRaw = (url.searchParams.get('mastery') ?? 'all').toLowerCase();
  const mastery = masteryRaw === 'mastery' ? 'mastery' : masteryRaw === 'not' ? 'not' : 'all';

  const limitRaw = url.searchParams.get('limit');
  const parsedLimit = limitRaw ? Number(limitRaw) : 10;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;

  // Base where
  const whereBase = {
    studentId,
    Assignment: { classroomId },
  } as const;

  const attempts = await prisma.attempt.findMany({
    where: whereBase,
    take: limit * 5 + 1,
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

  const mapped = attempts.map((a) => {
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

  // Apply mastery filter AFTER mapping
  const filtered =
    mastery === 'mastery'
      ? mapped.filter((r) => r.wasMastery)
      : mastery === 'not'
        ? mapped.filter((r) => !r.wasMastery)
        : mapped;

  // Pagination “hasMore” should be based on filtered results
  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;

  const nextCursor = hasMore ? String(page[page.length - 1].attemptId) : null;

  return NextResponse.json({ rows: page, nextCursor }, { status: 200 });
}
