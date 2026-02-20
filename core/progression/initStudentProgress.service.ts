import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { ALL_OPS } from '@/types/api/progression';
import type { OperationCode } from '@/types/api/progression';
import { getPolicyOps } from './ops.service';
import { distributeLevelAcrossOperations } from './leveling.service';
import { clampInt } from '@/utils';

export async function initializeStudentProgressForNewStudent(params: {
  classroomId: number;
  studentId: number;
  startingOperation?: OperationCode;
  startingLevel?: number;
}): Promise<void> {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId: params.classroomId },
    select: { enabledOperations: true, operationOrder: true, maxNumber: true },
  });

  if (!policy) {
    throw new NotFoundError('Progression policy not found');
  }

  const { enabledOperations, operationOrder, primaryOperation } = getPolicyOps({
    enabledOperations: policy.enabledOperations as unknown as OperationCode[],
    operationOrder: policy.operationOrder as unknown as OperationCode[],
  });

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);

  const startOpRaw = params.startingOperation ?? primaryOperation;
  const startOp: OperationCode = enabledOperations.includes(startOpRaw)
    ? startOpRaw
    : primaryOperation;

  const startLevelRaw = Number.isFinite(params.startingLevel ?? NaN)
    ? (params.startingLevel as number)
    : 1;
  const startLevel = Math.max(1, Math.trunc(startLevelRaw));

  const enabledOrder = operationOrder.length ? operationOrder : enabledOperations;
  const overflowLevels =
    startLevel > maxNumber
      ? distributeLevelAcrossOperations({
          operationOrder: enabledOrder,
          primaryOp: startOp,
          maxNumber,
          levelAmount: startLevel,
        })
      : [{ operation: startOp, level: clampInt(startLevel, 1, maxNumber) }];

  const map = new Map<OperationCode, number>();

  for (const op of enabledOperations) map.set(op, 1);

  const startIndex: number = enabledOrder.findIndex((o: OperationCode) => o === startOp);
  if (startIndex >= 0) {
    for (let i = 0; i < startIndex; i++) {
      const op = enabledOrder[i];
      if (enabledOperations.includes(op)) map.set(op, maxNumber);
    }
  }

  for (const row of overflowLevels) {
    if (enabledOperations.includes(row.operation)) {
      map.set(row.operation, clampInt(row.level, 1, maxNumber));
    }
  }

  const rows = ALL_OPS.map((op) => ({
    studentId: params.studentId,
    operation: op,
    level: map.get(op) ?? 1,
  }));

  await prisma.studentProgress.createMany({
    data: rows,
    skipDuplicates: true,
  });
}
