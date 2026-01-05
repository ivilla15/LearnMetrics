import { prisma } from '@/data/prisma';

export async function ensureQuestionsForLevel(level: number, _count = 12) {
  // 1) ensure QuestionSet exists
  const set = await prisma.questionSet.upsert({
    where: { level },
    update: {},
    create: { level },
    select: { id: true },
  });

  // 2) ensure the exact 12 table questions exist
  // IMPORTANT: requires a unique constraint on (setId, factorA, factorB)
  await prisma.$transaction(
    Array.from({ length: 12 }, (_, i) => {
      const b = i + 1;
      return prisma.question.upsert({
        where: {
          // this name depends on your schema's unique index name
          // see notes below
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
