import { Prisma } from '@prisma/client';

import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';
import type { OperandValue, AnswerValue } from '@/types';

export async function createAttempt(args: {
  studentId: number;
  assignmentId: number;
  score: number;
  total: number;
  completedAt?: Date | null;
  levelAtTime?: number | null;
}) {
  const { studentId, assignmentId, score, total } = args;

  return prisma.attempt.create({
    data: {
      studentId,
      assignmentId,
      score,
      total,
      completedAt: args.completedAt ?? null,
      levelAtTime: args.levelAtTime ?? null,
    },
  });
}

export async function createAttemptItems(
  items: Array<{
    attemptId: number;
    operation: OperationCode;
    operandAValue: OperandValue;
    operandBValue: OperandValue;
    correctAnswerValue: AnswerValue;
    givenAnswerValue: AnswerValue | null;
    isCorrect: boolean;
  }>,
) {
  if (items.length === 0) return;

  await prisma.attemptItem.createMany({
    data: items.map((it) => ({
      attemptId: it.attemptId,
      operation: it.operation,
      operandAValue: it.operandAValue,
      operandBValue: it.operandBValue,
      correctAnswerValue: it.correctAnswerValue,
      givenAnswerValue: it.givenAnswerValue ?? Prisma.JsonNull,
      isCorrect: it.isCorrect,
    })),
  });
}

export async function findByStudentWithAssignment(studentId: number) {
  return prisma.attempt.findMany({
    where: { studentId },
    include: {
      Assignment: {
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
        },
      },
    },
    orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }],
  });
}
