import { prisma } from '@/data/prisma';

export async function findBySetId(setId: number) {
  return prisma.question.findMany({
    where: { setId },
    select: { id: true, factorA: true, factorB: true, answer: true },
  });
}

export async function countBySetId(setId: number) {
  return prisma.question.count({ where: { setId } });
}

export async function createManyForSet(
  setId: number,
  rows: { factorA: number; factorB: number; answer: number }[],
) {
  return prisma.question.createMany({
    data: rows.map((r) => ({ ...r, setId })),
    skipDuplicates: true,
  });
}

export async function findByIds(ids: number[]) {
  if (ids.length === 0) return [];

  return prisma.question.findMany({
    where: { id: { in: ids } },
  });
}
