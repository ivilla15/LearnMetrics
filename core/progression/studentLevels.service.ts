import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/progression';

export async function getStudentLevelForOperation(params: {
  studentId: number;
  operation: OperationCode;
}): Promise<number> {
  const row = await prisma.studentProgress.findUnique({
    where: { studentId_operation: { studentId: params.studentId, operation: params.operation } },
    select: { level: true },
  });

  return row?.level ?? 1;
}
