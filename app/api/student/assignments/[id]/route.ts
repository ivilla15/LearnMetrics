import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import {
  requireStudent,
  getTableQuestionsForLevel,
  promoteStudentAfterMastery,
  getProgressionSnapshot,
  getStudentLevelForOperation,
} from '@/core';
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

function clampRequested(numQuestions: number | null, hasSet: boolean) {
  const base = numQuestions ?? 12;
  return hasSet ? base : Math.min(base, 12);
}

async function getAssignmentOrError(assignmentId: number) {
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

  if (!assignment) return { ok: false as const, response: jsonError('Assignment not found', 404) };
  return { ok: true as const, assignment };
}

function studentCanAccessAssignment(params: {
  assignment: {
    classroomId: number;
    recipients: { studentId: number }[];
  };
  student: { id: number; classroomId: number };
}) {
  const { assignment, student } = params;

  if (assignment.classroomId !== student.classroomId) {
    return { ok: false as const, response: jsonError('Not allowed', 403) };
  }

  const isTargeted = assignment.recipients.length > 0;
  if (isTargeted) {
    const allowed = assignment.recipients.some((r) => r.studentId === student.id);
    if (!allowed) return { ok: false as const, response: jsonError('Not allowed', 403) };
  }

  return { ok: true as const };
}

function getAssignmentStatus(params: { opensAt: Date; closesAt: Date | null; now: Date }) {
  const { opensAt, closesAt, now } = params;

  if (now < opensAt) return 'NOT_OPEN' as const;
  if (closesAt && now > closesAt) return 'CLOSED' as const;
  return 'OPEN' as const;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonError(auth.error, auth.status);
    const student = auth.student;

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return jsonError('Invalid assignment id', 400);

    const aRes = await getAssignmentOrError(assignmentId);
    if (!aRes.ok) return aRes.response;
    const assignment = aRes.assignment;

    const access = studentCanAccessAssignment({ assignment, student });
    if (!access.ok) return access.response;

    const requested = clampRequested(assignment.numQuestions, !!assignment.questionSetId);

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
      select: { id: true, score: true, total: true, completedAt: true, startedAt: true },
    });

    if (existingAttempt) {
      const ts = existingAttempt.completedAt ?? existingAttempt.startedAt;
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
            completedAt: ts ? ts.toISOString() : null,
          },
        },
        { status: 200 },
      );
    }

    const now = new Date();
    const status = getAssignmentStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now,
    });

    if (status === 'NOT_OPEN') {
      return NextResponse.json(
        { status: 'NOT_OPEN', assignment: assignmentPayload },
        { status: 200 },
      );
    }
    if (status === 'CLOSED') {
      return NextResponse.json(
        { status: 'CLOSED', assignment: assignmentPayload },
        { status: 200 },
      );
    }

    const snapshot = await getProgressionSnapshot(student.classroomId);
    const primaryOp = snapshot.primaryOperation;
    if (!primaryOp) return jsonError('Progression configuration invalid for classroom', 500);

    if (!assignment.questionSetId && primaryOp !== 'MUL') {
      return jsonError('This assignment requires a question set.', 409);
    }

    const level = assignment.questionSetId
      ? null
      : await getStudentLevelForOperation({ studentId: student.id, operation: primaryOp });

    let questions: { id: number; factorA: number; factorB: number; answer: number }[] = [];

    if (assignment.questionSetId) {
      questions = await prisma.question.findMany({
        where: { setId: assignment.questionSetId },
        select: { id: true, factorA: true, factorB: true, answer: true },
      });
    } else {
      const table = await getTableQuestionsForLevel(level as number);

      questions = table
        .filter((q) => q.factorA === level && q.factorB >= 1 && q.factorB <= 12)
        .sort((a, b) => a.factorB - b.factorB);
    }

    if (!questions.length) return jsonError('No questions available for this test', 409);
    if (questions.length < requested) {
      return jsonError(
        `Not enough questions available for this test. Need ${requested}, have ${questions.length}.`,
        409,
      );
    }

    const seed = assignment.id * 100000 + student.id;
    const picked = seededShuffle(questions, seed).slice(0, requested);

    return NextResponse.json(
      {
        status: 'READY',
        student: { id: student.id, name: student.name, operation: primaryOp, level },
        assignment: assignmentPayload,
        questions: picked.map((q) => ({ id: q.id, factorA: q.factorA, factorB: q.factorB })),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

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

    const aRes = await getAssignmentOrError(assignmentId);
    if (!aRes.ok) return aRes.response;
    const assignment = aRes.assignment;

    const access = studentCanAccessAssignment({ assignment, student });
    if (!access.ok) return access.response;

    const now = new Date();
    const status = getAssignmentStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now,
    });

    if (status === 'NOT_OPEN') return jsonError('Test not open yet', 409);
    if (status === 'CLOSED') return jsonError('Test window closed', 409);

    const existingAttempt = await prisma.attempt.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      select: { id: true },
    });
    if (existingAttempt) return jsonError('You already submitted this test', 409);

    const requested = clampRequested(assignment.numQuestions, !!assignment.questionSetId);

    const snapshot = await getProgressionSnapshot(student.classroomId);
    const primaryOp = snapshot.primaryOperation;
    if (!primaryOp) return jsonError('Progression configuration invalid for classroom', 500);

    if (!assignment.questionSetId && primaryOp !== 'MUL') {
      return jsonError('This assignment requires a question set.', 409);
    }

    const levelAtTime = assignment.questionSetId
      ? null
      : await getStudentLevelForOperation({ studentId: student.id, operation: primaryOp });

    let pool: { id: number; answer: number }[] = [];

    if (assignment.questionSetId) {
      pool = await prisma.question.findMany({
        where: { setId: assignment.questionSetId },
        select: { id: true, answer: true },
      });
    } else {
      const level = levelAtTime ?? 1;
      const table = await getTableQuestionsForLevel(level as number);

      const filtered = table
        .filter((q) => q.factorA === level && q.factorB >= 1 && q.factorB <= 12)
        .sort((a, b) => a.factorB - b.factorB);

      pool = filtered.map((q) => ({ id: q.id, answer: q.answer }));
    }

    if (pool.length < requested) {
      return jsonError(
        `Not enough questions available to grade this test. Need ${requested}, have ${pool.length}.`,
        409,
      );
    }

    const seed = assignment.id * 100000 + student.id;
    const allowed = seededShuffle(pool, seed).slice(0, requested);
    const allowedIds = new Set(allowed.map((q) => q.id));

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
          completedAt: new Date(),
          levelAtTime: levelAtTime ?? null,
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

      return attempt;
    });

    if (wasMastery && !assignment.questionSetId && levelAtTime !== null) {
      await promoteStudentAfterMastery({
        studentId: student.id,
        classroomId: student.classroomId,
        operation: primaryOp,
      });
    }

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
