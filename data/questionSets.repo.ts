import { prisma } from '@/data/prisma';

export async function findByLevel(level: number) {
  return prisma.questionSet.findUnique({ where: { level } });
}

export async function upsertByLevel(level: number) {
  return prisma.questionSet.upsert({
    where: { level },
    update: {},
    create: { level },
  });
}
