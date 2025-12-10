import { prisma } from '@/data/prisma';

export async function findByQuestionSetId(questionSetId: number) {
  return prisma.question.findMany({
    where: { setId: questionSetId },
    select: {
      id: true,
      factorA: true,
      factorB: true,
      answer: true,
    },
    orderBy: { id: 'asc' },
  });
}
