import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import type { OperationCode } from '@/types/enums';
import type { PromotionResultDTO } from '@/types/api/progression';
import { getProgressionSnapshot } from './policySnapshot.service';
import { ensureStudentProgress } from './studentProgress.service';

export async function promoteStudentAfterMastery(params: {
  studentId: number;
  classroomId: number;
  operation: OperationCode;
}): Promise<PromotionResultDTO> {
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
  const nextOp = idx >= 0 ? opOrder[idx + 1] : undefined;

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

  return { promoted: true, operation: nextOp, level: 1, movedToOperation: nextOp };
}
