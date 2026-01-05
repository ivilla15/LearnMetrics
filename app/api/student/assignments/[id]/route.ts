import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { ensureQuestionsForLevel } from '@/core/questions/service';
import { requireStudent } from '@/core/auth/requireStudent';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Tx = Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : never;

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type RouteCtx = { params: Promise<{ id: string }> };

type TableQuestion = {
  id: number;
  factorA: number;
  factorB: number;
  answer: number;
};

async function getTableQuestionsForLevel(level: number): Promise<TableQuestion[]> {
  await ensureQuestionsForLevel(level, 12);

  const set = await prisma.questionSet.findUnique({
    where: { level },
    select: {
      Question: {
        where: {
          factorA: level,
          factorB: { gte: 1, lte: 12 },
        },
        select: { id: true, factorA: true, factorB: true, answer: true },
        orderBy: { factorB: 'asc' },
      },
    },
  });

  return (set?.Question ?? []) as TableQuestion[];
}

export async function GET(_req: Request, { params }: RouteCtx) {
  const auth = await requireStudent();
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const student = auth.student;

  const { id } = await params;
  const assignmentId = parseId(id);
  if (!assignmentId) return jsonError('Invalid assignment id', 400);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classroomId: true,
      kind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      questionSetId: true,
      assignmentMode: true,
      numQuestions: true,
    },
  });
  if (!assignment) return jsonError('Assignment not found', 404);

  if (assignment.classroomId !== student.classroomId) {
    return jsonError('Not allowed', 403);
  }

  const baseRequested = assignment.numQuestions ?? 12;
  const requested = assignment.questionSetId ? baseRequested : Math.min(baseRequested, 12);

  const assignmentPayload = {
    id: assignment.id,
    kind: assignment.kind,
    mode: assignment.assignmentMode,
    opensAt: assignment.opensAt.toISOString(),
    closesAt: assignment.closesAt.toISOString(),
    windowMinutes: assignment.windowMinutes,
    numQuestions: requested,
  };

  const existingAttempt = await prisma.attempt.findUnique({
    where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
    select: { id: true, score: true, total: true, completedAt: true },
  });

  if (existingAttempt) {
    return NextResponse.json(
      {
        status: 'ALREADY_SUBMITTED',
        assignment: assignmentPayload,
        result: {
          score: existingAttempt.score,
          total: existingAttempt.total,
          percent:
            existingAttempt.total > 0
              ? Math.round((existingAttempt.score / existingAttempt.total) * 100)
              : 0,
          completedAt: existingAttempt.completedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  }

  const now = new Date();

  if (now < assignment.opensAt) {
    return NextResponse.json(
      { status: 'NOT_OPEN', assignment: assignmentPayload },
      { status: 200 },
    );
  }

  if (now > assignment.closesAt) {
    return NextResponse.json({ status: 'CLOSED', assignment: assignmentPayload }, { status: 200 });
  }

  // Load question pool (answers included server-side, stripped before sending)
  let questions: { id: number; factorA: number; factorB: number; answer: number }[] = [];

  if (assignment.questionSetId) {
    // If an explicit set is assigned, keep your old behavior
    questions = await prisma.question.findMany({
      where: { setId: assignment.questionSetId },
      select: { id: true, factorA: true, factorB: true, answer: true },
    });
  } else {
    // Default student-level behavior: fixed multiplication table (level × 1..12)
    questions = await getTableQuestionsForLevel(student.level);
  }

  if (!questions.length) {
    return jsonError('No questions available for this test', 409);
  }

  if (questions.length < requested) {
    return jsonError(
      `Not enough questions available for this test. Need ${requested}, have ${questions.length}.`,
      409,
    );
  }

  // Deterministic per student+assignment so refresh doesn't change the set
  const seed = assignment.id * 100000 + student.id;
  const picked = seededShuffle(questions, seed).slice(0, requested);

  return NextResponse.json(
    {
      status: 'READY',
      student: { id: student.id, name: student.name, level: student.level },
      assignment: assignmentPayload,
      questions: picked.map((q) => ({ id: q.id, factorA: q.factorA, factorB: q.factorB })),
    },
    { status: 200 },
  );
}

// POST: submit answers
export async function POST(req: Request, { params }: RouteCtx) {
  const auth = await requireStudent();
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const student = auth.student;

  const { id } = await params;
  const assignmentId = parseId(id);
  if (!assignmentId) return jsonError('Invalid assignment id', 400);

  const body = await req.json().catch(() => null);
  const answers = Array.isArray(body?.answers) ? body.answers : null;
  if (!answers || !answers.length) return jsonError('Invalid request body', 400);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classroomId: true,
      opensAt: true,
      closesAt: true,
      questionSetId: true,
      windowMinutes: true,
      numQuestions: true, // ✅ MUST include
    },
  });
  if (!assignment) return jsonError('Assignment not found', 404);
  if (assignment.classroomId !== student.classroomId) return jsonError('Not allowed', 403);

  const now = new Date();
  if (now < assignment.opensAt) return jsonError('Test not open yet', 409);
  if (now > assignment.closesAt) return jsonError('Test window closed', 409);

  const existingAttempt = await prisma.attempt.findUnique({
    where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
    select: { id: true },
  });
  if (existingAttempt) return jsonError('You already submitted this test', 409);

  // Load the SAME question pool as GET (with answers)
  let pool: { id: number; answer: number }[] = [];

  if (assignment.questionSetId) {
    pool = await prisma.question.findMany({
      where: { setId: assignment.questionSetId },
      select: { id: true, answer: true },
    });
  } else {
    const table = await getTableQuestionsForLevel(student.level);
    pool = table.map((q) => ({ id: q.id, answer: q.answer }));
  }

  const baseRequested = assignment.numQuestions ?? 12;
  const requested = assignment.questionSetId ? baseRequested : Math.min(baseRequested, 12);
  if (pool.length < requested) {
    return jsonError(
      `Not enough questions available to grade this test. Need ${requested}, have ${pool.length}.`,
      409,
    );
  }

  // Deterministic pick (must match GET)
  const seed = assignment.id * 100000 + student.id;
  const allowed = seededShuffle(pool, seed).slice(0, requested);

  const allowedIds = new Set(allowed.map((q) => q.id));

  // Build a submitted map of ONLY allowed question IDs
  const submittedMap = new Map<number, number>();
  for (const a of answers) {
    const qid = Number(a?.questionId);
    if (!Number.isFinite(qid)) continue;
    if (!allowedIds.has(qid)) continue;

    const rawVal = a?.givenAnswer;
    if (rawVal === null || rawVal === undefined || rawVal === '') continue;

    const n = Number(rawVal);
    if (Number.isFinite(n)) submittedMap.set(qid, n);
  }

  // Grade exactly requested questions; missing answers = incorrect
  const total = allowed.length;
  let score = 0;

  const items = allowed.map((q) => {
    const given = submittedMap.get(q.id);
    const isCorrect = given !== undefined && given === q.answer;
    if (isCorrect) score += 1;

    return {
      questionId: q.id,
      givenAnswer: given !== undefined ? given : -1,
      isCorrect,
    };
  });

  const wasMastery = total > 0 && score === total;

  const created = await prisma.$transaction(async (tx: Tx) => {
    const attempt = await tx.attempt.create({
      data: {
        studentId: student.id,
        assignmentId: assignment.id,
        score,
        total,
        levelAtTime: student.level, // ADD THIS
      },
      select: { id: true, score: true, total: true, completedAt: true },
    });

    await tx.attemptItem.createMany({
      data: items.map((it) => ({
        attemptId: attempt.id,
        questionId: it.questionId,
        givenAnswer: it.givenAnswer,
        isCorrect: it.isCorrect,
      })),
    });

    if (wasMastery) {
      await tx.student.update({
        where: { id: student.id },
        data: { level: Math.min(student.level + 1, 12) },
      });
    }

    return attempt;
  });

  return NextResponse.json(
    {
      ok: true,
      result: {
        score: created.score,
        total: created.total,
        percent: total > 0 ? Math.round((score / total) * 100) : 0,
        wasMastery,
        completedAt: created.completedAt.toISOString(),
      },
    },
    { status: 200 },
  );
}
