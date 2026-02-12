import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireStudent, getTableQuestionsForLevel } from '@/core';
import { jsonError, parseId, seededShuffle } from '@/utils';
import { readJson, handleApiError, type RouteContext } from '@/app';
import { z } from 'zod';

const SubmitBodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int(),
        givenAnswer: z.union([z.number(), z.string(), z.null()]),
      }),
    )
    .min(1),
});

async function getStudentMulLevel(studentId: number) {
  const row = await prisma.studentProgress.findUnique({
    where: { studentId_operation: { studentId, operation: 'MUL' } },
    select: { level: true },
  });
  // If backfill/ensure helpers ran, this should exist. Default defensively.
  return row?.level ?? 1;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
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
        type: true,
        mode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        questionSetId: true,
        numQuestions: true,
        recipients: { select: { studentId: true } },
      },
    });
    if (!assignment) return jsonError('Assignment not found', 404);

    if (assignment.classroomId !== student.classroomId) return jsonError('Not allowed', 403);

    const isTargeted = assignment.recipients.length > 0;
    if (isTargeted) {
      const allowed = assignment.recipients.some((r) => r.studentId === student.id);
      if (!allowed) return jsonError('Not allowed', 403);
    }

    const baseRequested = assignment.numQuestions ?? 12;
    const requested = assignment.questionSetId ? baseRequested : Math.min(baseRequested, 12);

    const assignmentPayload = {
      id: assignment.id,
      type: assignment.type,
      mode: assignment.mode,
      opensAt: assignment.opensAt.toISOString(),
      closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
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
            completedAt: existingAttempt.completedAt
              ? existingAttempt.completedAt.toISOString()
              : null,
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

    // If closesAt is null, treat as open-ended
    if (assignment.closesAt && now > assignment.closesAt) {
      return NextResponse.json(
        { status: 'CLOSED', assignment: assignmentPayload },
        { status: 200 },
      );
    }

    // Load question pool (answers included server-side, stripped before sending)
    let questions: { id: number; factorA: number; factorB: number; answer: number }[] = [];

    const mulLevel = await getStudentMulLevel(student.id);

    if (assignment.questionSetId) {
      questions = await prisma.question.findMany({
        where: { setId: assignment.questionSetId },
        select: { id: true, factorA: true, factorB: true, answer: true },
      });
    } else {
      // Default behavior: fixed multiplication table (level × 1..12)
      const table = await getTableQuestionsForLevel(mulLevel);

      questions = table
        .filter((q) => q.factorA === mulLevel && q.factorB >= 1 && q.factorB <= 12)
        .sort((a, b) => a.factorB - b.factorB);
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
        student: { id: student.id, name: student.name, level: mulLevel },
        assignment: assignmentPayload,
        questions: picked.map((q) => ({ id: q.id, factorA: q.factorA, factorB: q.factorB })),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

// POST: submit answers
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonError(auth.error, auth.status);
    const student = auth.student;

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return jsonError('Invalid assignment id', 400);

    const body = await readJson(req);
    const { answers } = SubmitBodySchema.parse(body);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        classroomId: true,
        type: true,
        mode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        questionSetId: true,
        numQuestions: true,
        recipients: { select: { studentId: true } },
      },
    });
    if (!assignment) return jsonError('Assignment not found', 404);

    if (assignment.classroomId !== student.classroomId) return jsonError('Not allowed', 403);

    const isTargeted = assignment.recipients.length > 0;
    if (isTargeted) {
      const allowed = assignment.recipients.some((r) => r.studentId === student.id);
      if (!allowed) return jsonError('Not allowed', 403);
    }

    const now = new Date();
    if (now < assignment.opensAt) return jsonError('Test not open yet', 409);
    if (assignment.closesAt && now > assignment.closesAt)
      return jsonError('Test window closed', 409);

    const existingAttempt = await prisma.attempt.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      select: { id: true },
    });
    if (existingAttempt) return jsonError('You already submitted this test', 409);

    const mulLevel = await getStudentMulLevel(student.id);

    // Load the SAME question pool as GET (with answers)
    let pool: { id: number; answer: number }[] = [];

    if (assignment.questionSetId) {
      pool = await prisma.question.findMany({
        where: { setId: assignment.questionSetId },
        select: { id: true, answer: true },
      });
    } else {
      const table = await getTableQuestionsForLevel(mulLevel);

      const filtered = table
        .filter((q) => q.factorA === mulLevel && q.factorB >= 1 && q.factorB <= 12)
        .sort((a, b) => a.factorB - b.factorB);

      pool = filtered.map((q) => ({ id: q.id, answer: q.answer }));
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
      const qid = Number(a.questionId);
      if (!Number.isFinite(qid)) continue;
      if (!allowedIds.has(qid)) continue;

      const rawVal = a.givenAnswer;
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

    const created = await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          score,
          total,
          levelAtTime: mulLevel,
          completedAt: new Date(),
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
        const nextLevel = Math.min(mulLevel + 1, 12);

        // Prefer update (row should exist). Fall back to upsert defensively.
        await tx.studentProgress.upsert({
          where: { studentId_operation: { studentId: student.id, operation: 'MUL' } },
          create: { studentId: student.id, operation: 'MUL', level: nextLevel },
          update: { level: nextLevel },
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
          completedAt: created.completedAt ? created.completedAt.toISOString() : null,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
