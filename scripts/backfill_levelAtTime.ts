import { prisma } from '@/data/prisma';

async function main() {
  const attempts = await prisma.attempt.findMany({
    where: { levelAtTime: null },
    select: { id: true, studentId: true },
  });

  for (const a of attempts) {
    const student = await prisma.student.findUnique({
      where: { id: a.studentId },
      select: { level: true },
    });

    await prisma.attempt.update({
      where: { id: a.id },
      data: { levelAtTime: student?.level ?? 1 },
    });
  }

  console.log(`Backfilled ${attempts.length} attempts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
