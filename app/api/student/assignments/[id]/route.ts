import { z } from 'zod';

import { prisma } from '@/data/prisma';
import {
  getProgressionSnapshot,
  getStudentLevelForOperation,
  getStudentActiveProgress,
  promoteStudentAfterMastery,
  generateQuestions,
  gradeGeneratedQuestions,
  resolveModifierForOperationLevel,
} from '@/core';
import { requireStudent } from '@/core/auth';
import { readJson, handleApiError, type RouteContext } from '@/app/api/_shared';
import { clampInt, percent, parseId, errorResponse, jsonResponse, getStatus } from '@/utils';
import type { AnswerValue } from '@/types';
import { Prisma } from '@prisma/client';

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
  return assignmentId * 100_000 + studentId;
}

function parseFractionAnswer(raw: string): AnswerValue | null {
  const match = raw.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return {
    kind: 'fraction',
    numerator: Math.trunc(numerator),
    denominator: Math.trunc(denominator),
  };
}

function parseSubmittedAnswer(raw: number | string | null): AnswerValue | null {
  if (raw === null || raw === '') return null;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return { kind: 'decimal', value: raw };
  }

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fraction = parseFractionAnswer(trimmed);
  if (fraction) return fraction;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;

  return { kind: 'decimal', value: numeric };
}

type AssignmentRouteParams = { id: string };

export async function GET(req: Request, { params }: RouteContext<AssignmentRouteParams>) {
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
        durationMinutes: true,
        recipients: { select: { studentId: true } },
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    if (!studentCanAccessAssignment({ assignment, student })) {
      return errorResponse('Not allowed', 403);
    }

    const assignmentPayload = {
      id: assignment.id,
      type: assignment.type,
      mode: assignment.mode,
      targetKind: assignment.targetKind,
      opensAt: assignment.opensAt.toISOString(),
      closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
      windowMinutes: assignment.windowMinutes,
      numQuestions: assignment.numQuestions,
      durationMinutes: assignment.durationMinutes ?? null,
      operation: assignment.operation ?? null,
    };

    const now = new Date();
    const status = getStatus({
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

    if (assignment.targetKind === 'PRACTICE_TIME') {
      return jsonResponse(
        {
          status: 'READY_PRACTICE_TIME',
          assignment: assignmentPayload,
        },
        200,
      );
    }

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
          attemptId: existingAttempt.id,
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

    const snapshot = await getProgressionSnapshot(student.classroomId);
    const maxNumber = clampInt(snapshot.maxNumber, 1, 100);

    const active = await getStudentActiveProgress({ studentId: student.id, snapshot });
    const operation = assignment.operation ?? active.operation;

    const level =
      assignment.operation != null
        ? await getStudentLevelForOperation({ studentId: student.id, operation })
        : active.level;

    const modifier =
      assignment.operation != null
        ? resolveModifierForOperationLevel({
            operation,
            level,
            snapshot,
          })
        : active.modifier;

    const count = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      seed: assignmentSeed(assignment.id, student.id),
      operation,
      level,
      maxNumber,
      count,
      modifier,
    });

    return jsonResponse(
      {
        status: 'READY',
        student: {
          id: student.id,
          name: student.name,
          operation,
          level,
          modifier,
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
    const status = getStatus({
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
    const maxNumberAtTime = clampInt(snapshot.maxNumber, 1, 100);

    const active = await getStudentActiveProgress({ studentId: student.id, snapshot });
    const operation = assignment.operation ?? active.operation;

    const levelAtTime =
      assignment.operation != null
        ? await getStudentLevelForOperation({ studentId: student.id, operation })
        : active.level;

    const modifierAtTime =
      assignment.operation != null
        ? resolveModifierForOperationLevel({
            operation,
            level: levelAtTime,
            snapshot,
          })
        : active.modifier;

    const total = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      seed: assignmentSeed(assignment.id, student.id),
      operation,
      level: levelAtTime,
      maxNumber: maxNumberAtTime,
      count: total,
      modifier: modifierAtTime,
    });

    const answersByQuestionId = new Map<number, AnswerValue | null>();
    for (const a of parsed.answers) {
      answersByQuestionId.set(a.questionId, parseSubmittedAnswer(a.givenAnswer));
    }

    const answersByIndex: Record<number, AnswerValue | null> = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      answersByIndex[i] = q ? (answersByQuestionId.get(q.id) ?? null) : null;
    }

    const graded = gradeGeneratedQuestions({
      questions,
      answersByIndex,
    });

    const wasMastery = graded.total > 0 && graded.score === graded.total;

    const created = await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          score: graded.score,
          total: graded.total,
          completedAt: new Date(),
          operationAtTime: operation,
          levelAtTime,
          maxNumberAtTime,
        },
        select: { id: true, score: true, total: true, completedAt: true },
      });

      await tx.attemptItem.createMany({
        data: questions.map((q, idx) => {
          const item = graded.items[idx];
          return {
            attemptId: attempt.id,
            operation: q.operation,
            operandAValue: q.operandA,
            operandBValue: q.operandB,
            correctAnswerValue: item?.correctAnswer ?? null,
            givenAnswerValue: item?.studentAnswer ?? Prisma.JsonNull,
            isCorrect: item?.isCorrect ?? false,
          };
        }),
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
