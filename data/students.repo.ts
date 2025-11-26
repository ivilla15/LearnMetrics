import { prisma } from '@/data/prisma';

export async function findStudentsWithLatestAttempt(classroomId: number) {
  // Join students + attempts, order by completedAt desc per student.
  const students = await prisma.student.findMany({
    where: { classroomId },
    orderBy: { name: 'asc' },
    include: {
      attempts: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          assignmentId: true,
          score: true,
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
    lastAttempt: s.attempts.length ? s.attempts[0] : null,
  }));
}
