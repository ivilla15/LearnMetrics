// src/data/questions.repo.ts
import { prisma } from '@/data/prisma';

export async function findByQuestionSetId(setId: number) {
  return prisma.question.findMany({
    where: { setId },
  });
}

// NEW:
export async function findByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return prisma.question.findMany({
    where: { id: { in: ids } },
  });
}
