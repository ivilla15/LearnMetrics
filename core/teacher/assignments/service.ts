// core/teacher/assignments/service.ts
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { prisma } from '@/data/prisma';
import { parseCursor, clampTake, percent as pct } from '@/utils';

export type TeacherAssignmentListRow = {
  assignmentId: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  opensAt: string;
  closesAt: string | null;
  windowMinutes: number | null;
  numQuestions: number;
  attemptedCount: number;
  masteryCount: number;
  masteryRate: number; // 0-100
  avgPercent: number; // 0-100
};

export type TeacherAssignmentAttemptsRow = {
  attemptId: number | null;
  studentId: number;
  studentName: string;
  studentUsername: string;
  completedAt: string | null;
  score: number | null;
  total: number | null;
  percent: number | null;
  wasMastery: boolean | null;
};

export type TeacherAttemptDetailDTO = {
  attemptId: number;
  completedAt: string | null;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  student: { id: number; name: string; username: string };
  assignment?: {
    id: number;
    type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
    mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
    opensAt: string;
    closesAt: string | null;
    windowMinutes: number | null;
  };
  items: Array<{
    id: number;
    prompt: string;
    studentAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
};

export async function listTeacherAssignmentsForClassroom(params: {
  teacherId: number;
  classroomId: number;
  scope?: 'past' | 'upcoming' | 'all';
  cursor?: string | null;
  take?: number;
}): Promise<{ rows: TeacherAssignmentListRow[]; nextCursor: string | null }> {
  const { teacherId, classroomId } = params;
  const scope = params.scope ?? 'past';
  const cursorId = parseCursor(params.cursor ?? null);
  const take = clampTake(params.take ?? 20, 20, 50);

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const now = new Date();

  const where =
    scope === 'past'
      ? { classroomId, closesAt: { not: null, lt: now } }
      : scope === 'upcoming'
        ? { classroomId, opensAt: { gt: now } }
        : { classroomId };

  const rows = await prisma.assignment.findMany({
    where,
    // Keep cursor pagination stable on id
    orderBy: { id: 'desc' },
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      type: true,
      mode: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
    },
  });

  const page = rows.slice(0, take);
  const hasMore = rows.length > take;
  const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].id) : null;

  const assignmentIds = page.map((a) => a.id);
  if (assignmentIds.length === 0) return { rows: [], nextCursor: null };

  // One attempt per student per assignment (by your app rules), so count(attempts) ~= attemptedCount.
  const attempts = await prisma.attempt.findMany({
    where: { assignmentId: { in: assignmentIds } },
    select: {
      assignmentId: true,
      score: true,
      total: true,
    },
  });

  const agg = new Map<
    number,
    { attemptedCount: number; masteryCount: number; sumPercent: number }
  >();

  for (const a of attempts) {
    const cur = agg.get(a.assignmentId) ?? { attemptedCount: 0, masteryCount: 0, sumPercent: 0 };
    cur.attemptedCount += 1;
    const p = pct(a.score, a.total);
    cur.sumPercent += p;
    if (a.total > 0 && a.score === a.total) cur.masteryCount += 1;
    agg.set(a.assignmentId, cur);
  }

  const mapped: TeacherAssignmentListRow[] = page.map((a) => {
    const stat = agg.get(a.id) ?? { attemptedCount: 0, masteryCount: 0, sumPercent: 0 };
    const attemptedCount = stat.attemptedCount;
    const masteryCount = stat.masteryCount;
    const masteryRate = attemptedCount > 0 ? Math.round((masteryCount / attemptedCount) * 100) : 0;
    const avgPercent = attemptedCount > 0 ? Math.round(stat.sumPercent / attemptedCount) : 0;

    return {
      assignmentId: a.id,
      type: a.type,
      mode: a.mode,
      opensAt: a.opensAt.toISOString(),
      closesAt: a.closesAt ? a.closesAt.toISOString() : null,
      windowMinutes: a.windowMinutes,
      numQuestions: a.numQuestions ?? 12,
      attemptedCount,
      masteryCount,
      masteryRate,
      avgPercent,
    };
  });

  return { rows: mapped, nextCursor };
}

export async function listTeacherAssignmentAttempts(params: {
  teacherId: number;
  classroomId: number;
  assignmentId: number;
  filter?: 'ALL' | 'MASTERY' | 'NOT_MASTERY' | 'MISSING';
}): Promise<{
  assignment: {
    assignmentId: number;
    type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
    mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
    opensAt: string;
    closesAt: string | null;
    windowMinutes: number | null;
    numQuestions: number;
  };
  rows: TeacherAssignmentAttemptsRow[];
  nextCursor: string | null;
}> {
  const { teacherId, classroomId, assignmentId } = params;
  const filter = (params.filter ?? 'ALL').toUpperCase() as
    | 'ALL'
    | 'MASTERY'
    | 'NOT_MASTERY'
    | 'MISSING';

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, classroomId },
    select: {
      id: true,
      type: true,
      mode: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
    },
  });
  if (!assignment) throw new Error('Assignment not found');

  const students = await prisma.student.findMany({
    where: { classroomId },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, username: true },
  });

  const attempts = await prisma.attempt.findMany({
    where: {
      assignmentId: assignment.id,
      studentId: { in: students.map((s) => s.id) },
    },
    select: {
      id: true,
      studentId: true,
      score: true,
      total: true,
      completedAt: true,
    },
  });

  const byStudent = new Map<number, (typeof attempts)[number]>();
  for (const a of attempts) byStudent.set(a.studentId, a);

  let rows: TeacherAssignmentAttemptsRow[] = students.map((s) => {
    const a = byStudent.get(s.id) ?? null;
    if (!a) {
      return {
        attemptId: null,
        studentId: s.id,
        studentName: s.name,
        studentUsername: s.username,
        completedAt: null,
        score: null,
        total: null,
        percent: null,
        wasMastery: null,
      };
    }

    const percent = pct(a.score, a.total);
    const wasMastery = a.total > 0 && a.score === a.total;

    return {
      attemptId: a.id,
      studentId: s.id,
      studentName: s.name,
      studentUsername: s.username,
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
      score: a.score,
      total: a.total,
      percent,
      wasMastery,
    };
  });

  // Filters
  if (filter === 'MISSING') {
    rows = rows.filter((r) => r.attemptId === null);
  } else if (filter === 'MASTERY') {
    rows = rows.filter((r) => r.wasMastery === true);
  } else if (filter === 'NOT_MASTERY') {
    rows = rows.filter((r) => r.attemptId !== null && r.wasMastery === false);
  } else {
    // ALL: keep everyone (including missing) but show attempted first
    rows.sort((a, b) => {
      const aHas = a.attemptId ? 1 : 0;
      const bHas = b.attemptId ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      const ad = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bd = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bd - ad;
    });
  }

  return {
    assignment: {
      assignmentId: assignment.id,
      type: assignment.type,
      mode: assignment.mode,
      opensAt: assignment.opensAt.toISOString(),
      closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
      windowMinutes: assignment.windowMinutes,
      numQuestions: assignment.numQuestions ?? 12,
    },
    rows,
    nextCursor: null,
  };
}

export async function getTeacherAttemptDetail(params: {
  teacherId: number;
  classroomId: number;
  attemptId: number;
}): Promise<TeacherAttemptDetailDTO> {
  const { teacherId, classroomId, attemptId } = params;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId },
    select: {
      id: true,
      score: true,
      total: true,
      completedAt: true,
      Student: { select: { id: true, classroomId: true, name: true, username: true } },
      Assignment: {
        select: {
          id: true,
          classroomId: true,
          type: true,
          mode: true,
          opensAt: true,
          closesAt: true,
          windowMinutes: true,
        },
      },
      AttemptItem: {
        select: {
          id: true,
          givenAnswer: true,
          isCorrect: true,
          Question: { select: { factorA: true, factorB: true, answer: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!attempt) throw new Error('Attempt not found');

  // Ownership guard: attempt must belong to this classroom
  if (
    attempt.Student.classroomId !== classroomId ||
    attempt.Assignment.classroomId !== classroomId
  ) {
    throw new Error('Not allowed');
  }

  const percent = pct(attempt.score, attempt.total);
  const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

  return {
    attemptId: attempt.id,
    completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : null,
    score: attempt.score,
    total: attempt.total,
    percent,
    wasMastery,
    student: {
      id: attempt.Student.id,
      name: attempt.Student.name,
      username: attempt.Student.username,
    },
    assignment: {
      id: attempt.Assignment.id,
      type: attempt.Assignment.type,
      mode: attempt.Assignment.mode,
      opensAt: attempt.Assignment.opensAt.toISOString(),
      closesAt: attempt.Assignment.closesAt ? attempt.Assignment.closesAt.toISOString() : null,
      windowMinutes: attempt.Assignment.windowMinutes,
    },
    items: attempt.AttemptItem.map((it) => ({
      id: it.id,
      prompt: `${it.Question.factorA} × ${it.Question.factorB}`,
      studentAnswer: it.givenAnswer,
      correctAnswer: it.Question.answer,
      isCorrect: it.isCorrect,
    })),
  };
}
