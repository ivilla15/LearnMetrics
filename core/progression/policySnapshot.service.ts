import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { clampInt } from '@/utils/math';
import type { ProgressionSnapshotDTO, ModifierRuleDTO } from '@/types/api/progression';
import type { OperationCode } from '@/types/enums';
import { getPolicyOps } from './ops.service';

export async function getProgressionSnapshot(classroomId: number): Promise<ProgressionSnapshotDTO> {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId },
    select: {
      enabledOperations: true,
      operationOrder: true,
      maxNumber: true,
      modifierRules: {
        select: {
          modifier: true,
          operations: true,
          minLevel: true,
          propagate: true,
          enabled: true,
        },
        orderBy: [{ minLevel: 'asc' }, { id: 'asc' }],
      },
    },
  });

  if (!policy) throw new NotFoundError('Progression policy not found');

  const ops = getPolicyOps({
    enabledOperations: policy.enabledOperations as unknown as OperationCode[],
    operationOrder: policy.operationOrder as unknown as OperationCode[],
  });

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);

  const modifierRules: ModifierRuleDTO[] = policy.modifierRules.map((rule) => ({
    modifier: rule.modifier,
    operations: rule.operations as unknown as OperationCode[],
    minLevel: clampInt(rule.minLevel ?? 1, 1, maxNumber),
    propagate: Boolean(rule.propagate),
    enabled: Boolean(rule.enabled),
  }));

  return {
    enabledOperations: ops.enabledOperations,
    operationOrder: ops.operationOrder,
    primaryOperation: ops.primaryOperation,
    maxNumber,
    modifierRules,
  };
}
