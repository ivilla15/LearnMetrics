import { prisma } from '@/data/prisma';
import type { DomainCode } from '@/types/domain';

export async function findByStudentId(
  studentId: number,
): Promise<Array<{ domain: DomainCode; level: number }>> {
  const rows = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true, level: true },
    orderBy: { domain: 'asc' },
  });
  return rows;
}
