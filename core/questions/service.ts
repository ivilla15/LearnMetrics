import { prisma } from '@/data/prisma';

export async function ensureQuestionsForLevel(level: number, count: number) {
  const set = await prisma.questionSet.upsert({
    where: { level },
    update: {},
    create: { level },
    select: { id: true },
  });

  await prisma.$transaction(
    Array.from({ length: count }, (_, i) => {
      const b = i + 1;
      return prisma.question.upsert({
        where: {
          setId_factorA_factorB: { setId: set.id, factorA: level, factorB: b },
        },
        update: { answer: level * b },
        create: {
          setId: set.id,
          factorA: level,
          factorB: b,
          answer: level * b,
        },
      });
    }),
  );

  return set.id;
}
