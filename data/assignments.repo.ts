import { prisma } from '@/data/prisma';
import { AssignmentKind } from '@prisma/client';

type CreateArgs = {
  classroomId: number;
  questionSetId: number;
  opensAt: Date;
  closesAt: Date;
  kind?: AssignmentKind; // defaults to FRIDAY_TEST if not provided
  windowMinutes?: number; // defaults to 4 in schema
};

export async function findByClassroomKindAndOpensAt(args: {
  classroomId: number;
  kind: AssignmentKind;
  opensAt: Date;
}) {
  const { classroomId, kind, opensAt } = args;
  return prisma.assignment.findUnique({
    where: {
      classroomId_kind_opensAt: { classroomId, kind, opensAt }, // composite unique
    },
  });
}

export async function create(args: CreateArgs) {
  const {
    classroomId,
    questionSetId,
    opensAt,
    closesAt,
    kind = AssignmentKind.FRIDAY_TEST,
    windowMinutes = 4,
  } = args;

  return prisma.assignment.create({
    data: { classroomId, questionSetId, kind, opensAt, closesAt, windowMinutes },
  });
}
