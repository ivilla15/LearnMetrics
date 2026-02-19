import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import type { OperationCode } from '@/types/progression';
import { getProgressionSnapshot } from './policySnapshot.service';
import { ensureStudentProgress } from './studentProgress.service';

export type PromotionResult =
  | { promoted: false; operation: OperationCode; level: number }
  | { promoted: true; operation: OperationCode; level: number; movedToOperation?: OperationCode };

export async function promoteStudentAfterMastery(params: {
  studentId: number;
  classroomId: number;
  operation: OperationCode;
}): Promise<PromotionResult> {
  const { studentId, classroomId, operation } = params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, classroomId: true },
  });
  if (!student || student.classroomId !== classroomId) {
    throw new NotFoundError('Student not found in classroom');
  }

  await ensureStudentProgress(studentId);

  const snapshot = await getProgressionSnapshot(classroomId);
  const maxNumber = snapshot.maxNumber;

  const opOrder = snapshot.operationOrder.length
    ? snapshot.operationOrder
    : snapshot.enabledOperations;

  const current = await prisma.studentProgress.findUnique({
    where: { studentId_operation: { studentId, operation } },
    select: { level: true },
  });

  const currentLevel = current?.level ?? 1;

  if (currentLevel < maxNumber) {
    const nextLevel = Math.min(currentLevel + 1, maxNumber);

    await prisma.studentProgress.update({
      where: { studentId_operation: { studentId, operation } },
      data: { level: nextLevel },
    });

    return { promoted: false, operation, level: nextLevel };
  }

  const idx = opOrder.indexOf(operation);
  const nextOp = idx >= 0 ? (opOrder[idx + 1] as OperationCode | undefined) : undefined;

  if (!nextOp) {
    await prisma.studentProgress.update({
      where: { studentId_operation: { studentId, operation } },
      data: { level: maxNumber },
    });

    return { promoted: false, operation, level: maxNumber };
  }

  await prisma.$transaction([
    prisma.studentProgress.update({
      where: { studentId_operation: { studentId, operation } },
      data: { level: maxNumber },
    }),
    prisma.studentProgress.update({
      where: { studentId_operation: { studentId, operation: nextOp } },
      data: { level: 1 },
    }),
  ]);

  return {
    promoted: true,
    operation: nextOp,
    level: 1,
    movedToOperation: nextOp,
  };
}
