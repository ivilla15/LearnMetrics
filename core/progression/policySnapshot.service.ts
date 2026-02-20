import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { clampInt } from '@/utils';
import type { OperationCode } from '@/types/api/progression';
import { getPolicyOps } from './ops.service';

export async function getProgressionSnapshot(classroomId: number): Promise<{
  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  primaryOperation: OperationCode;
  maxNumber: number;
}> {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId },
    select: { enabledOperations: true, operationOrder: true, maxNumber: true },
  });

  if (!policy) throw new NotFoundError('Progression policy not found');

  const ops = getPolicyOps({
    enabledOperations: policy.enabledOperations as unknown as OperationCode[],
    operationOrder: policy.operationOrder as unknown as OperationCode[],
  });

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);

  return {
    enabledOperations: ops.enabledOperations,
    operationOrder: ops.operationOrder,
    primaryOperation: ops.primaryOperation,
    maxNumber,
  };
}
