import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type RouteCtx = { params: Promise<{ id: string }> };

// GET: load assignment + questions + status
export async function GET(_req: Request, { params }: RouteCtx) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('student_session')?.value;
  const studentId = parseId(raw ?? '');
  if (!studentId) return jsonError('Not signed in', 401);

  const { id } = await params;
  const assignmentId = parseId(id);
  if (!assignmentId) return jsonError('Invalid assignment id', 400);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, level: true, classroomId: true },
  });
  if (!student) return jsonError('Student not found', 404);

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
    },
  });
  if (!assignment) return jsonError('Assignment not found', 404);
  if (assignment.classroomId !== student.classroomId) return jsonError('Not allowed', 403);

  const now = new Date();
  if (now < assignment.opensAt) {
    return NextResponse.json(
      {
        status: 'NOT_OPEN',
        assignment: {
          id: assignment.id,
          kind: assignment.kind,
          mode: assignment.assignmentMode,
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt.toISOString(),
          windowMinutes: assignment.windowMinutes,
        },
      },
      { status: 200 },
    );
  }

  if (now > assignment.closesAt) {
    return NextResponse.json(
      {
        status: 'CLOSED',
        assignment: {
          id: assignment.id,
          kind: assignment.kind,
          mode: assignment.assignmentMode,
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt.toISOString(),
          windowMinutes: assignment.windowMinutes,
        },
      },
      { status: 200 },
    );
  }

  // one attempt rule
  const existingAttempt = await prisma.attempt.findUnique({
    where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
    select: { id: true, score: true, total: true, completedAt: true },
  });

  if (existingAttempt) {
    return NextResponse.json(
      {
        status: 'ALREADY_SUBMITTED',
        assignment: {
          id: assignment.id,
          kind: assignment.kind,
          mode: assignment.assignmentMode,
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt.toISOString(),
          windowMinutes: assignment.windowMinutes,
        },
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

  // choose question set: assignment.questionSetId OR student.level
  const questionSetId = assignment.questionSetId ?? null;

  let questions;
  if (questionSetId) {
    questions = await prisma.question.findMany({
      where: { setId: questionSetId },
      select: { id: true, factorA: true, factorB: true, answer: true },
    });
  } else {
    const set = await prisma.questionSet.findUnique({
      where: { level: student.level },
      select: {
        id: true,
        Question: { select: { id: true, factorA: true, factorB: true, answer: true } },
      },
    });
    questions = set?.Question ?? [];
  }

  if (!questions.length) return jsonError('No questions available for this test', 409);

  const picked = shuffle(questions).slice(0, 30); // your Friday test standard
  // IMPORTANT: do NOT send answers to client. send only factors.
  return NextResponse.json(
    {
      status: 'READY',
      student: { id: student.id, name: student.name, level: student.level },
      assignment: {
        id: assignment.id,
        kind: assignment.kind,
        mode: assignment.assignmentMode,
        opensAt: assignment.opensAt.toISOString(),
        closesAt: assignment.closesAt.toISOString(),
        windowMinutes: assignment.windowMinutes,
      },
      questions: picked.map((q) => ({ id: q.id, factorA: q.factorA, factorB: q.factorB })),
    },
    { status: 200 },
  );
}

// POST: submit answers
export async function POST(req: Request, { params }: RouteCtx) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('student_session')?.value;
  const studentId = parseId(raw ?? '');
  if (!studentId) return jsonError('Not signed in', 401);

  const { id } = await params;
  const assignmentId = parseId(id);
  if (!assignmentId) return jsonError('Invalid assignment id', 400);

  const body = await req.json().catch(() => null);
  const answers = Array.isArray(body?.answers) ? body.answers : null;

  if (!answers || !answers.length) return jsonError('Invalid request body', 400);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, level: true, classroomId: true },
  });
  if (!student) return jsonError('Student not found', 404);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classroomId: true,
      opensAt: true,
      closesAt: true,
      questionSetId: true,
      windowMinutes: true,
    },
  });
  if (!assignment) return jsonError('Assignment not found', 404);
  if (assignment.classroomId !== student.classroomId) return jsonError('Not allowed', 403);

  const now = new Date();
  if (now < assignment.opensAt) return jsonError('Test not open yet', 409);
  if (now > assignment.closesAt) return jsonError('Test window closed', 409);

  // one-attempt rule (hard gate)
  const existingAttempt = await prisma.attempt.findUnique({
    where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
    select: { id: true },
  });
  if (existingAttempt) return jsonError('You already submitted this test', 409);

  // Load correct answers server-side
  const questionIds = answers.map((a: any) => Number(a?.questionId)).filter(Number.isFinite);
  const dbQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, answer: true },
  });

  const answerMap = new Map(dbQuestions.map((q) => [q.id, q.answer]));
  const total = dbQuestions.length;

  // grade
  let score = 0;
  const items = dbQuestions.map((q) => {
    const submitted = answers.find((a: any) => Number(a?.questionId) === q.id);
    const givenAnswer = Number(submitted?.givenAnswer);
    const isCorrect = Number.isFinite(givenAnswer) && givenAnswer === q.answer;
    if (isCorrect) score += 1;

    return {
      questionId: q.id,
      givenAnswer: Number.isFinite(givenAnswer) ? givenAnswer : -1,
      isCorrect,
    };
  });

  const wasMastery = total > 0 && score === total;

  // write attempt + items
  const created = await prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.create({
      data: {
        studentId: student.id,
        assignmentId: assignment.id,
        score,
        total,
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

    // mastery rule: level up by 1 (max 12)
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
