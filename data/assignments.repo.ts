import { LatestAssignmentDTO } from '@/core/assignments/service';
import { prisma } from '@/data/prisma';

// Local constant for our only assignment kind for now
export const FRIDAY_KIND = 'FRIDAY_TEST' as const;
export type AssignmentKind = typeof FRIDAY_KIND;

type CreateArgs = {
  classroomId: number;
  opensAt: Date;
  closesAt: Date;
  kind?: AssignmentKind; // defaults to FRIDAY_TEST if not provided
  windowMinutes?: number; // defaults to 4 in schema
};

// data/assignments.repo.ts

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
    // mode is included by default unless you have a select
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
}) {
  return prisma.assignment.create({
    data: {
      classroomId: args.classroomId,
      kind: args.kind,
      assignmentMode: args.assignmentMode,
      opensAt: args.opensAt,
      closesAt: args.closesAt,
      windowMinutes: args.windowMinutes,
    } as any,
  });
}

export async function findLatestForClassroom(classroomId: number) {
  const rows = await prisma.assignment.findMany({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
    take: 1,
  });

  return rows[0] ?? null;
}
