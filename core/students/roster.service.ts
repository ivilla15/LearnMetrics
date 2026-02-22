import * as StudentsRepo from '@/data/students.repo';
import { prisma } from '@/data/prisma';
import { getPolicyOps } from '@/core/progression/ops.service';
import type { OperationCode } from '@/types/enums';

export async function getClassroomRosterWithLatestAttempt(classroomId: number) {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId },
    select: { enabledOperations: true, operationOrder: true },
  });

  const enabledOperations = (policy?.enabledOperations ?? ['MUL']) as OperationCode[];
  const operationOrder = (policy?.operationOrder ?? ['MUL']) as OperationCode[];

  const ops = getPolicyOps({
    enabledOperations,
    operationOrder,
  });

  return StudentsRepo.findStudentsWithLatestAttempt(classroomId, ops.primaryOperation);
}
