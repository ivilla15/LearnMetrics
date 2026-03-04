import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { OPERATION_CODES, type OperationCode } from '@/types/enums';
import { clampInt } from '@/utils/math';
import { getPolicyOps } from './ops.service';

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

  if (!policy) throw new NotFoundError('Progression policy not found');

  const { enabledOperations, operationOrder, primaryOperation } = getPolicyOps({
    enabledOperations: policy.enabledOperations as unknown as OperationCode[],
    operationOrder: policy.operationOrder as unknown as OperationCode[],
  });

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);
  const completedLevel = maxNumber + 1;

  const startOpRaw = params.startingOperation ?? primaryOperation;
  const startOp: OperationCode = enabledOperations.includes(startOpRaw)
    ? startOpRaw
    : primaryOperation;

  const startLevelRaw = Number.isFinite(params.startingLevel ?? NaN)
    ? (params.startingLevel as number)
    : 1;
  const startLevel = clampInt(Math.trunc(startLevelRaw), 1, completedLevel);

  const enabledOrder = operationOrder.length ? operationOrder : enabledOperations;

  const map = new Map<OperationCode, number>();
  for (const op of enabledOperations) map.set(op, 1);

  const startIndex = enabledOrder.findIndex((o) => o === startOp);
  if (startIndex >= 0) {
    for (let i = 0; i < startIndex; i++) {
      const op = enabledOrder[i];
      if (enabledOperations.includes(op)) map.set(op, completedLevel);
    }
  }

  if (enabledOperations.includes(startOp)) {
    map.set(startOp, startLevel);
  }

  const rows = OPERATION_CODES.map((op) => ({
    studentId: params.studentId,
    operation: op,
    level: map.get(op) ?? 1,
  }));

  await prisma.studentProgress.createMany({
    data: rows,
    skipDuplicates: true,
  });
}
