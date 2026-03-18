import { prisma } from '@/data/prisma';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { OPERATION_CODES, type OperationCode } from '@/types/enums';
import type { ProgressionPolicyInputDTO } from '@/types/api/progression';
import { clamp, uniq } from '@/utils/math';

export async function getOrCreateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const existing = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId: params.classroomId },
    include: {
      modifierRules: {
        select: {
          id: true,
          modifier: true,
          operations: true,
          minLevel: true,
          propagate: true,
          enabled: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (existing) return existing;

  return prisma.classroomProgressionPolicy.create({
    data: {
      classroomId: params.classroomId,
      enabledOperations: [...OPERATION_CODES],
      operationOrder: [...OPERATION_CODES],
      maxNumber: 12,
    },
    include: {
      modifierRules: {
        select: {
          id: true,
          modifier: true,
          operations: true,
          minLevel: true,
          propagate: true,
          enabled: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });
}

export async function updateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
  input: ProgressionPolicyInputDTO;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  // Assume caller validated with Zod schema; still sanitize defensively
  const enabledOperations = uniq(params.input.enabledOperations).filter((op): op is OperationCode =>
    OPERATION_CODES.includes(op),
  );

  if (enabledOperations.length === 0) {
    throw new Error('enabledOperations must include at least one operation');
  }

  const enabledSet = new Set(enabledOperations);

  const operationOrderRaw =
    params.input.operationOrder && params.input.operationOrder.length > 0
      ? params.input.operationOrder
      : enabledOperations;

  const operationOrder = uniq(operationOrderRaw)
    .filter((op): op is OperationCode => OPERATION_CODES.includes(op))
    .filter((op) => enabledSet.has(op));

  // ensure every enabled op appears in order (stable, predictable)
  for (const op of enabledOperations) {
    if (!operationOrder.includes(op)) operationOrder.push(op);
  }

  const maxNumber = clamp(params.input.maxNumber, 1, 100);

  const modifierRules = (params.input.modifierRules ?? [])
    .map((r) => ({
      modifier: r.modifier,
      operations: uniq(r.operations).filter((op): op is OperationCode => enabledSet.has(op)),
      minLevel: clamp(r.minLevel, 1, maxNumber),
      propagate: !!r.propagate,
      enabled: !!r.enabled,
    }))
    .filter((r) => r.operations.length > 0);

  return prisma.$transaction(async (tx) => {
    const policy = await tx.classroomProgressionPolicy.upsert({
      where: { classroomId: params.classroomId },
      create: {
        classroomId: params.classroomId,
        enabledOperations,
        operationOrder,
        maxNumber,
      },
      update: {
        enabledOperations,
        operationOrder,
        maxNumber,
      },
      select: { id: true },
    });

    await tx.modifierRule.deleteMany({ where: { policyId: policy.id } });

    if (modifierRules.length > 0) {
      await tx.modifierRule.createMany({
        data: modifierRules.map((r) => ({
          policyId: policy.id,
          modifier: r.modifier,
          operations: r.operations,
          minLevel: r.minLevel,
          propagate: r.propagate,
          enabled: r.enabled,
        })),
      });
    }

    return tx.classroomProgressionPolicy.findUnique({
      where: { classroomId: params.classroomId },
      include: {
        modifierRules: {
          select: {
            id: true,
            modifier: true,
            operations: true,
            minLevel: true,
            propagate: true,
            enabled: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });
  });
}
