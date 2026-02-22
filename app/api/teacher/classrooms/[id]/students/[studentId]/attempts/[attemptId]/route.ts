import { prisma } from '@/data/prisma';
import { requireStudent, opSymbol } from '@/core';
import { handleApiError, StudentAttemptRouteContext } from '@/app';
import { jsonResponse, errorResponse, parseId, percent } from '@/utils';
import type { AttemptDetailDTO, OperationCode } from '@/types';

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
        assignmentId: true,

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
    if (attempt.studentId !== auth.student.id) return errorResponse('Not allowed', 403);
    if (!attempt.completedAt) return errorResponse('Attempt not completed', 409);

    // No legacy fallbacks: snapshot must exist.
    if (!attempt.operationAtTime || attempt.levelAtTime == null) {
      throw new Error('Attempt snapshot missing operationAtTime/levelAtTime');
    }

    const pct = percent(attempt.score, attempt.total);
    const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

    const dto: AttemptDetailDTO = {
      attemptId: attempt.id,
      completedAt: attempt.completedAt.toISOString(),

      operation: attempt.operationAtTime as OperationCode,
      levelAtTime: attempt.levelAtTime,

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
