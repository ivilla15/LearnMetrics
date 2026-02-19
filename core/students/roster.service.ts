import * as StudentsRepo from '@/data/students.repo';
import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/progression';
import { getPolicyOps } from '@/core/progression/ops.service';
import { Operation } from '@prisma/client';

export async function getClassroomRosterWithLatestAttempt(classroomId: number) {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId },
    select: { enabledOperations: true, operationOrder: true },
  });

  const ops = getPolicyOps({
    enabledOperations: (policy?.enabledOperations ?? ['MUL']) as unknown as OperationCode[],
    operationOrder: (policy?.operationOrder ?? ['MUL']) as unknown as OperationCode[],
  });

  return StudentsRepo.findStudentsWithLatestAttempt(
    classroomId,
    ops.primaryOperation as unknown as Operation,
  );
}
