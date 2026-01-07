import { prisma } from '@/data/prisma';

// Local constant for our only assignment kind for now
export const SCHEDULE_KIND = 'SCHEDULED_TEST' as const;
export type AssignmentKind = typeof SCHEDULE_KIND;

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

export async function create(args: {
  classroomId: number;
  kind: AssignmentKind;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number;
  questionSetId?: number | null;
  numQuestions: number;
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
    },
  });
}

export async function findLatestForClassroom(classroomId: number) {
  return prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
  });
}

export async function findById(id: number) {
  return prisma.assignment.findUnique({
    where: { id },
  });
}

export async function deleteByClassroomId(classroomId: number) {
  return prisma.assignment.deleteMany({
    where: { classroomId },
  });
}
