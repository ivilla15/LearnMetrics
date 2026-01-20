import { prisma } from '@/data/prisma';
import { ensureQuestionsForLevel } from './service';

export type TableQuestion = {
  id: number;
  factorA: number;
  factorB: number;
  answer: number;
};

export async function getTableQuestionsForLevel(level: number): Promise<TableQuestion[]> {
  await ensureQuestionsForLevel(level, 12);

  const set = await prisma.questionSet.findUnique({
    where: { level },
    select: {
      Question: {
        where: {
          factorA: level,
          factorB: { gte: 1, lte: 12 },
        },
        select: { id: true, factorA: true, factorB: true, answer: true },
        orderBy: { factorB: 'asc' },
      },
    },
  });

  const qs = set?.Question ?? [];
  return qs.map((q) => ({
    id: q.id,
    factorA: q.factorA,
    factorB: q.factorB,
    answer: q.answer,
  }));
}
