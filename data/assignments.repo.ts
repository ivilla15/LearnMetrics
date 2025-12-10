import { prisma } from '@/data/prisma';

// Local constant for our only assignment kind for now
export const FRIDAY_KIND = 'FRIDAY_TEST' as const;
export type AssignmentKind = typeof FRIDAY_KIND;

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

export async function findById(id: number) {
  return prisma.assignment.findUnique({
    where: { id },
  });
}

export async function create(args: CreateArgs) {
  const {
    classroomId,
    questionSetId,
    opensAt,
    closesAt,
    kind = FRIDAY_KIND,
    windowMinutes = 4,
  } = args;

  return prisma.assignment.create({
    data: { classroomId, questionSetId, kind, opensAt, closesAt, windowMinutes },
  });
}
