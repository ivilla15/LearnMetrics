// data/assignments.repo.ts
import { prisma } from '@/data/prisma';
import type { Type } from '@prisma/client';

export async function findAssignmentById(assignmentId: number) {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
}

export async function findByClassroomKindAndOpensAt(args: {
  classroomId: number;
  kind: Type;
  opensAt: Date;
}) {
  return prisma.assignment.findFirst({
    where: {
      classroomId: args.classroomId,
      type: args.kind,
      opensAt: args.opensAt,
    },
  });
}

export async function createAssignment(args: {
  classroomId: number;
  kind: Type;
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number;
  questionSetId?: number | null;
  numQuestions: number;
  scheduleId?: number | null;
}) {
  return prisma.assignment.create({
    data: {
      classroomId: args.classroomId,
      type: args.kind,
      mode: args.mode,
      opensAt: args.opensAt,
      closesAt: args.closesAt,
      windowMinutes: args.windowMinutes,
      questionSetId: args.questionSetId ?? null,
      numQuestions: args.numQuestions,
      scheduleId: args.scheduleId ?? null,
    },
  });
}

export async function findLatestAssignmentForClassroom(classroomId: number) {
  return prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
  });
}

export async function deleteAssignmentsByClassroomId(classroomId: number) {
  return prisma.assignment.deleteMany({
    where: { classroomId },
  });
}
