import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import type { OperationCode, ProgressionPolicyInput, ModifierRule } from '@/types/progression';

async function assertTeacherOwnsClassroom(teacherId: number, classroomId: number) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');
  if (classroom.teacherId !== teacherId) throw new ConflictError('Not allowed');
  return classroom;
}

function uniqOps(ops: OperationCode[]): OperationCode[] {
  const out: OperationCode[] = [];
  const seen = new Set<OperationCode>();
  for (const op of ops) {
    if (!seen.has(op)) {
      seen.add(op);
      out.push(op);
    }
  }
  return out;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeModifierRules(params: {
  enabledOperations: OperationCode[];
  maxNumber: number;
  rules: ModifierRule[];
}): ModifierRule[] {
  const enabledSet = new Set(params.enabledOperations);

  return params.rules.map((r) => ({
    modifier: r.modifier,
    operations: uniqOps(r.operations.filter((op) => enabledSet.has(op))),
    minLevel: clamp(r.minLevel, 1, params.maxNumber),
    propagate: !!r.propagate,
    enabled: !!r.enabled,
  }));
}

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
      enabledOperations: ['MUL'],
      operationOrder: ['MUL'],
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
  input: ProgressionPolicyInput;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const enabledOperations = uniqOps(params.input.enabledOperations);
  const enabledSet = new Set(enabledOperations);

  const operationOrder = uniqOps(params.input.operationOrder).filter((op) => enabledSet.has(op));

  const maxNumber = clamp(params.input.maxNumber, 1, 100);

  const modifierRules = sanitizeModifierRules({
    enabledOperations,
    maxNumber,
    rules: params.input.modifierRules,
  }).filter((r) => r.operations.length > 0);

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

    await tx.modifierRule.deleteMany({
      where: { policyId: policy.id },
    });

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
