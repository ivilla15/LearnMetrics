// data/assignments.repo.ts
import { prisma } from '@/data/prisma';
import type { AssignmentKind } from '@prisma/client';

export async function findAssignmentById(assignmentId: number) {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
}

export async function findByClassroomKindAndOpensAt(args: {
  classroomId: number;
  kind: AssignmentKind;
  opensAt: Date;
}) {
  return prisma.assignment.findFirst({
    where: {
      classroomId: args.classroomId,
      kind: args.kind,
      opensAt: args.opensAt,
    },
  });
}

export async function createAssignment(args: {
  classroomId: number;
  kind: AssignmentKind;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
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
      kind: args.kind,
      assignmentMode: args.assignmentMode,
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
