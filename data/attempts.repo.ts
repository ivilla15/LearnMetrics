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
      // startedAt is defaulted in DB; completedAt should be set on submit elsewhere
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
          opensAt: true,
          closesAt: true,
        },
      },
    },
    // completedAt is nullable now, so order by startedAt to avoid null-order surprises
    orderBy: { startedAt: 'desc' },
  });
}