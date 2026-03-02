import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';

export async function findByStudentId(studentId: number) {
  return prisma.studentProgress.findMany({
    where: { studentId },
    select: {
      operation: true,
      level: true,
    },
    orderBy: { operation: 'asc' },
  }) as Promise<Array<{ operation: OperationCode; level: number }>>;
}
