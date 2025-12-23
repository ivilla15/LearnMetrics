import { prisma } from '@/data/prisma';

export async function findStudentsWithLatestAttempt(classroomId: number) {
  // Join students + attempts, order by completedAt desc per student.
  const students = await prisma.student.findMany({
    where: { classroomId },
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
    orderBy: { name: 'asc' },
  });

  return students.map((s: (typeof students)[number]) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    password: s.password,
    level: s.level,
    lastAttempt: s.Attempt.length ? s.Attempt[0] : null,
  }));
}

export async function findById(id: number) {
  return prisma.student.findUnique({
    where: { id },
  });
}

// Extra helpers for teacher dashboard (roster CRUD)

export type CreateStudentData = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  level: number;
};

export async function createManyForClassroom(classroomId: number, students: CreateStudentData[]) {
  if (!students.length) return [];
  const now = new Date();

  await prisma.student.createMany({
    data: students.map((s) => ({
      classroomId,
      name: `${s.firstName} ${s.lastName}`,
      username: s.username,
      password: s.password,
      level: s.level,
      updatedAt: now,
    })),
    skipDuplicates: true,
  });

  // Reuse your existing helper to get the full roster with lastAttempt
  return findStudentsWithLatestAttempt(classroomId); // 👈 FULL roster
}

export async function updateById(
  id: number,
  data: { name?: string; username?: string; level?: number },
) {
  return prisma.student.update({
    where: { id },
    data,
  });
}

export async function deleteById(id: number) {
  return prisma.student.delete({
    where: { id },
  });
}

export async function deleteByClassroomId(classroomId: number) {
  return prisma.student.deleteMany({
    where: { classroomId },
  });
}
