import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import type { OperationCode } from '@/types';

export type ProgressionPolicyInput = {
  enabledOperations: OperationCode[];
  maxNumber: number;
  divisionIntegersOnly: boolean;
};

async function assertTeacherOwnsClassroom(teacherId: number, classroomId: number) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');
  if (classroom.teacherId !== teacherId) throw new ConflictError('Not allowed');
  return classroom;
}

export async function getOrCreateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const existing = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId: params.classroomId },
  });
  if (existing) return existing;

  return prisma.classroomProgressionPolicy.create({
    data: {
      classroomId: params.classroomId,
      enabledOperations: ['MUL'],
      maxNumber: 12,
      divisionIntegersOnly: true,
    },
  });
}

export async function updateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
  input: ProgressionPolicyInput;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  return prisma.classroomProgressionPolicy.upsert({
    where: { classroomId: params.classroomId },
    create: { classroomId: params.classroomId, ...params.input },
    update: { ...params.input },
  });
}
