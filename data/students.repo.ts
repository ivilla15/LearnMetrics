import { prisma } from '@/data/prisma';

export async function findStudentsWithLatestAttempt(classroomId: number) {
  // Join students + attempts, order by completedAt desc per student.
  const students = await prisma.student.findMany({
    where: { classroomId },
    orderBy: { name: 'asc' },
    include: {
      Attempt: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          assignmentId: true,
          score: true,
          total: true,
          completedAt: true,
        },
      },
    },
  });

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    level: s.level,
    lastAttempt: s.Attempt.length ? s.Attempt[0] : null,
  }));
}

export async function findById(id: number) {
  return prisma.student.findUnique({
    where: { id },
  });
}
