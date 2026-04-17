import { prisma } from '@/data/prisma';
import type { DomainCode } from '@/types/domain';

export async function getStudentLevelForDomain(params: {
  studentId: number;
  domain: DomainCode;
}): Promise<number> {
  const row = await prisma.studentProgress.findUnique({
    where: { studentId_domain: { studentId: params.studentId, domain: params.domain } },
    select: { level: true },
  });

  return row?.level ?? 1;
}
