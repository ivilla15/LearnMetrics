import { z } from 'zod';

import { prisma } from '@/data/prisma';
import {
  getProgressionSnapshot,
  getStudentActiveProgress,
  promoteStudentAfterMastery,
  generateQuestions,
  gradeGeneratedQuestions,
  studentCanAccessAssignment,
  getMaxUniqueQuestionsFor,
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
        durationMinutes: true,
        requiredSets: true,
        minimumScorePercent: true,
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
      requiredSets: assignment.requiredSets ?? null,
      minimumScorePercent: assignment.minimumScorePercent ?? null,
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
      const practiceSnapshot = await getProgressionSnapshot(student.classroomId);
      const practiceMaxNumber = clampInt(practiceSnapshot.maxNumber, 1, 100);
      const practiceActive = await getStudentActiveProgress({
        studentId: student.id,
        snapshot: practiceSnapshot,
      });
      const practiceOperation = practiceActive.operation;
      const practiceLevel = practiceActive.level;
      const practiceModifier = practiceActive.modifier;
      const available = getMaxUniqueQuestionsFor({
        operation: practiceOperation,
        level: practiceLevel,
        maxNumber: practiceMaxNumber,
        modifier: practiceModifier,
      });
      const requestedPerSet = assignment.numQuestions > 0 ? assignment.numQuestions : 10;
      const numQuestionsPerSet = Math.min(requestedPerSet, available);

      return jsonResponse(
        {
          status: 'READY_PRACTICE_TIME',
          assignment: assignmentPayload,
          progression: {
            operation: practiceOperation,
            level: practiceLevel,
            maxNumber: practiceMaxNumber,
            modifier: practiceModifier,
            numQuestionsPerSet,
          },
        },
        200,
      );
    }

    const existingAttempt = await prisma.attempt.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      select: { id: true, score: true, total: true, completedAt: true, startedAt: true },
    });

    if (existingAttempt?.completedAt) {
      const ts = existingAttempt.completedAt;
      return jsonResponse(
        {
          status: 'ALREADY_SUBMITTED',
          assignment: assignmentPayload,
          attemptId: existingAttempt.id,
          result: {
            score: existingAttempt.score,
            total: existingAttempt.total,
            percent: percent(existingAttempt.score, existingAttempt.total),
            completedAt: ts.toISOString(),
          },
        },
        200,
      );
    }

    const snapshot = await getProgressionSnapshot(student.classroomId);

    const active = await getStudentActiveProgress({ studentId: student.id, snapshot });
    const operation = active.operation;
    const level = active.level;
    const modifier = active.modifier;
    const domain = active.domain;

    const count = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      domain,
      level,
      count,
      seed: assignmentSeed(assignment.id, student.id),
    });

    const draft = await prisma.attempt.upsert({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: assignment.id } },
      create: {
        studentId: student.id,
        assignmentId: assignment.id,
        score: 0,
        total: count,
        startedAt: new Date(),
      },
      update: {},
      select: { startedAt: true },
    });
    const sessionStartedAt = draft.startedAt;

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
        sessionStartedAt: sessionStartedAt.toISOString(),
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
        windowMinutes: true,
        numQuestions: true,
        durationMinutes: true,
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
      select: { id: true, completedAt: true, startedAt: true },
    });
    if (existingAttempt?.completedAt)
      return errorResponse('You already submitted this assignment', 409);

    if (assignment.windowMinutes && existingAttempt) {
      const elapsedMs = now.getTime() - existingAttempt.startedAt.getTime();
      const limitMs = assignment.windowMinutes * 60 * 1000;
      if (elapsedMs > limitMs + 30_000) {
        return errorResponse('Time limit exceeded', 409);
      }
    }

    if (assignment.durationMinutes && existingAttempt) {
      const elapsedMs = now.getTime() - existingAttempt.startedAt.getTime();
      const limitMs = assignment.durationMinutes * 60 * 1000;
      if (elapsedMs > limitMs + 30_000) {
        return errorResponse('Time limit exceeded', 409);
      }
    }

    const snapshot = await getProgressionSnapshot(student.classroomId);
    const maxNumberAtTime = clampInt(snapshot.maxNumber, 1, 100);

    const active = await getStudentActiveProgress({ studentId: student.id, snapshot });
    const operation = active.operation;
    const levelAtTime = active.level;
    const domain = active.domain;

    const total = clampInt(assignment.numQuestions, 1, 200);

    const questions = generateQuestions({
      domain,
      level: levelAtTime,
      count: total,
      seed: assignmentSeed(assignment.id, student.id),
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
      const attempt = existingAttempt
        ? await tx.attempt.update({
            where: { id: existingAttempt.id },
            data: {
              score: graded.score,
              total: graded.total,
              completedAt: new Date(),
              operationAtTime: operation,
              levelAtTime,
              maxNumberAtTime,
              domainAtTime: domain,
            },
            select: { id: true, score: true, total: true, completedAt: true },
          })
        : await tx.attempt.create({
            data: {
              studentId: student.id,
              assignmentId: assignment.id,
              score: graded.score,
              total: graded.total,
              completedAt: new Date(),
              operationAtTime: operation,
              levelAtTime,
              maxNumberAtTime,
              domainAtTime: domain,
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
        domain,
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
