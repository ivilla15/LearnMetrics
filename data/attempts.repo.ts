import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';

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
      // startedAt defaults in DB
    },
  });
}

export async function createAttemptItems(
  items: Array<{
    attemptId: number;

    operation: OperationCode;
    operandA: number;
    operandB: number;

    correctAnswer: number;
    givenAnswer: number;

    isCorrect: boolean;
  }>,
) {
  if (items.length === 0) return;

  await prisma.attemptItem.createMany({
    data: items.map((it) => ({
      attemptId: it.attemptId,
      operation: it.operation,
      operandA: it.operandA,
      operandB: it.operandB,
      correctAnswer: it.correctAnswer,
      givenAnswer: it.givenAnswer,
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
          operation: true,
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
