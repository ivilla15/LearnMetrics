import { prisma } from '@/data/prisma';

type CreateAttemptArgs = {
  studentId: number;
  assignmentId: number;
  score: number;
  total: number;
};

export async function createAttempt(args: CreateAttemptArgs) {
  const { studentId, assignmentId, score, total } = args;
  return prisma.attempt.create({
    data: {
      studentId,
      assignmentId,
      score,
      total,
    },
  });
}

type AttemptItemInput = {
  attemptId: number;
  questionId: number;
  givenAnswer: number;
  isCorrect: boolean;
};

export async function createAttemptItems(items: AttemptItemInput[]) {
  if (items.length === 0) return;
  await prisma.attemptItem.createMany({
    data: items,
  });
}
