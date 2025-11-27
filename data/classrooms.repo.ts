import { prisma } from '@/data/prisma';

export async function findClassroomById(id: number) {
  return prisma.classroom.findUnique({
    where: { id },
  });
}
