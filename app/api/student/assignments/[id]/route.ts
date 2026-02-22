import { prisma } from '@/data/prisma';
import {
  getProgressionSnapshot,
  getStudentLevelForOperation,
  promoteStudentAfterMastery,
  requireStudent,
  generateQuestions,
  computeAnswerInt,
} from '@/core';
import { readJson, handleApiError, type RouteContext } from '@/app/api/_shared';
import { clampInt, percent, parseId, errorResponse, jsonResponse } from '@/utils';
import { z } from 'zod';

const submitBodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        givenAnswer: z.union([z.number(), z.string(), z.null()]),
      }),
    )
    .min(1),
});

function getAssignmentStatus(params: { opensAt: Date; closesAt: Date | null; now: Date }) {
  const { opensAt, closesAt, now } = params;
  if (now < opensAt) return 'NOT_OPEN' as const;
  if (closesAt && now > closesAt) return 'CLOSED' as const;
  return 'OPEN' as const;
}

function studentCanAccessAssignment(params: {
  assignment: { classroomId: number; recipients: Array<{ studentId: number }> };
  student: { id: number; classroomId: number };
}) {
  const { assignment, student } = params;

  if (assignment.classroomId !== student.classroomId) return false;

  const isTargeted = assignment.recipients.length > 0;
  if (!isTargeted) return true;

  return assignment.recipients.some((r) => r.studentId === student.id);
}

function assignmentSeed(assignmentId: number, studentId: number) {
  // stable deterministic seed
  return assignmentId * 100_000 + studentId;
}

type AssignmentRouteParams = { id: string };

export async function GET(_req: Request, { params }: RouteContext<AssignmentRouteParams>) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const student = auth.student;

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return errorResponse('Invalid assignment id', 400);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        classroomId: true,
        type: true,
        mode: true,
        targetKind: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,
        operation: true,
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    if (!studentCanAccessAssignment({ assignment, student })) {
      return errorResponse('Not allowed', 403);
    }

    if (assignment.targetKind !== 'ASSESSMENT') {
      return errorResponse('This assignment is practice-time based.', 409);
    }

    const assignmentPayload = {
      id: assignment.id,
      type: assignment.type,
      mode: assignment.mode,
      opensAt: assignment.opensAt.toISOString(),
      closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
      windowMinutes: assignment.windowMinutes,
      numQuestions: assignment.numQuestions,
    };

    const existingAttempt = await prisma.attempt.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      select: { id: true, score: true, total: true, completedAt: true, startedAt: true },
    });

    if (existingAttempt) {
      const ts = existingAttempt.completedAt ?? existingAttempt.startedAt;
      return jsonResponse(
        {
          status: 'ALREADY_SUBMITTED',
          assignment: assignmentPayload,
          result: {
            score: existingAttempt.score,
            total: existingAttempt.total,
            percent: percent(existingAttempt.score, existingAttempt.total),
            completedAt: ts ? ts.toISOString() : null,
          },
        },
        200,
      );
    }

    const now = new Date();
    const status = getAssignmentStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now,
    });

    if (status === 'NOT_OPEN') {
      return jsonResponse({ status: 'NOT_OPEN', assignment: assignmentPayload }, 200);
    }
    if (status === 'CLOSED') {
      return jsonResponse({ status: 'CLOSED', assignment: assignmentPayload }, 200);
    }

    const snapshot = await getProgressionSnapshot(student.classroomId);

    const operation = assignment.operation ?? snapshot.primaryOperation;
    const maxNumber = clampInt(snapshot.maxNumber, 1, 100);
    const level = await getStudentLevelForOperation({ studentId: student.id, operation });

    const count = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      seed: assignmentSeed(assignment.id, student.id),
      operation,
      level,
      maxNumber,
      count,
    });

    return jsonResponse(
      {
        status: 'READY',
        student: {
          id: student.id,
          name: student.name,
          operation,
          level,
        },
        assignment: assignmentPayload,
        questions,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(req: Request, { params }: RouteContext<AssignmentRouteParams>) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const student = auth.student;

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return errorResponse('Invalid assignment id', 400);

    const body = await readJson(req);
    const parsed = submitBodySchema.parse(body);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        classroomId: true,
        type: true,
        mode: true,
        targetKind: true,
        opensAt: true,
        closesAt: true,
        numQuestions: true,
        operation: true,
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    if (!studentCanAccessAssignment({ assignment, student })) {
      return errorResponse('Not allowed', 403);
    }

    if (assignment.targetKind !== 'ASSESSMENT') {
      return errorResponse('This assignment is practice-time based.', 409);
    }

    const now = new Date();
    const status = getAssignmentStatus({
      opensAt: assignment.opensAt,
      closesAt: assignment.closesAt,
      now,
    });

    if (status === 'NOT_OPEN') return errorResponse('Assignment not open yet', 409);
    if (status === 'CLOSED') return errorResponse('Assignment window closed', 409);

    const existingAttempt = await prisma.attempt.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      select: { id: true },
    });
    if (existingAttempt) return errorResponse('You already submitted this assignment', 409);

    const snapshot = await getProgressionSnapshot(student.classroomId);

    const operation = assignment.operation ?? snapshot.primaryOperation;
    const maxNumberAtTime = clampInt(snapshot.maxNumber, 1, 100);
    const levelAtTime = await getStudentLevelForOperation({ studentId: student.id, operation });

    const total = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      seed: assignmentSeed(assignment.id, student.id),
      operation,
      level: levelAtTime,
      maxNumber: maxNumberAtTime,
      count: total,
    });

    // answers keyed by GeneratedQuestionDTO.id
    const answersById = new Map<number, number>();
    for (const a of parsed.answers) {
      const qid = Number(a.questionId);
      if (!Number.isFinite(qid)) continue;

      const raw = a.givenAnswer;
      if (raw === null || raw === undefined || raw === '') continue;

      const n = Number(raw);
      if (Number.isFinite(n)) answersById.set(qid, Math.trunc(n));
    }

    let score = 0;

    const items = questions.map((q) => {
      const correctAnswer = computeAnswerInt(q.operation, q.operandA, q.operandB);
      const givenAnswer = answersById.get(q.id);
      const given = givenAnswer === undefined ? -1 : givenAnswer;

      const isCorrect = given !== -1 && given === correctAnswer;
      if (isCorrect) score += 1;

      return {
        operation: q.operation,
        operandA: q.operandA,
        operandB: q.operandB,
        correctAnswer,
        givenAnswer: given,
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
          operationAtTime: operation,
          levelAtTime,
          maxNumberAtTime,
        },
        select: { id: true, score: true, total: true, completedAt: true },
      });

      await tx.attemptItem.createMany({
        data: items.map((it) => ({
          attemptId: attempt.id,
          operation: it.operation,
          operandA: it.operandA,
          operandB: it.operandB,
          correctAnswer: it.correctAnswer,
          givenAnswer: it.givenAnswer,
          isCorrect: it.isCorrect,
        })),
      });

      return attempt;
    });

    if (wasMastery) {
      await promoteStudentAfterMastery({
        studentId: student.id,
        classroomId: student.classroomId,
        operation,
      });
    }

    return jsonResponse(
      {
        ok: true,
        result: {
          score: created.score,
          total: created.total,
          percent: percent(created.score, created.total),
          wasMastery,
          completedAt: created.completedAt ? created.completedAt.toISOString() : null,
        },
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
