import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { handleApiError } from '@/app/api/_shared/handle-error';
import { jsonResponse, errorResponse } from '@/utils/http';
import { parseId } from '@/utils';
import { percent } from '@/utils/math';

import type { AttemptDetailDTO } from '@/types/api/attempts';
import type { OperationCode } from '@/types/enums';

import { opSymbol } from '@/core';
import type { StudentAttemptRouteContext } from '@/app/api/_shared/route-types';

export async function GET(_req: Request, { params }: StudentAttemptRouteContext) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { attemptId: rawAttemptId } = await params;
    const attemptId = parseId(rawAttemptId);
    if (!attemptId) return errorResponse('Invalid attempt id', 400);

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        score: true,
        total: true,
        completedAt: true,
        operationAtTime: true,
        levelAtTime: true,
        Assignment: {
          select: {
            type: true,
            mode: true,
            opensAt: true,
            closesAt: true,
            windowMinutes: true,
          },
        },
        AttemptItem: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            operation: true,
            operandA: true,
            operandB: true,
            correctAnswer: true,
            givenAnswer: true,
            isCorrect: true,
          },
        },
      },
    });

    if (!attempt) return errorResponse('Attempt not found', 404);

    // Ownership enforcement
    if (attempt.studentId !== auth.student.id) return errorResponse('Not allowed', 403);

    // Only completed attempts should be viewable
    if (!attempt.completedAt) return errorResponse('Attempt not completed', 409);

    const pct = percent(attempt.score, attempt.total);
    const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

    // These should exist for modern rows; older rows may be missing snapshots
    const operation = (attempt.operationAtTime ?? 'MUL') as OperationCode;
    const levelAtTime = attempt.levelAtTime ?? 1;

    const dto: AttemptDetailDTO = {
      attemptId: attempt.id,
      completedAt: attempt.completedAt.toISOString(),
      operation,
      levelAtTime,
      score: attempt.score,
      total: attempt.total,
      percent: pct,
      wasMastery,
      assignment: attempt.Assignment
        ? {
            type: attempt.Assignment.type,
            mode: attempt.Assignment.mode,
            opensAt: attempt.Assignment.opensAt.toISOString(),
            closesAt: attempt.Assignment.closesAt
              ? attempt.Assignment.closesAt.toISOString()
              : null,
            windowMinutes: attempt.Assignment.windowMinutes ?? null,
          }
        : undefined,
      items: attempt.AttemptItem.map((it) => ({
        id: it.id,
        prompt: `${it.operandA} ${opSymbol(it.operation as OperationCode)} ${it.operandB}`,
        studentAnswer: it.givenAnswer,
        correctAnswer: it.correctAnswer,
        isCorrect: it.isCorrect,
      })),
    };

    return jsonResponse(dto, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
