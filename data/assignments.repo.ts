import { prisma } from '@/data/prisma';
import type {
  AssignmentMode,
  AssignmentTargetKind,
  AssignmentType,
  OperationCode,
} from '@/types/enums';

export async function findAssignmentById(assignmentId: number) {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
}

export async function findByClassroomTypeAndOpensAt(args: {
  classroomId: number;
  type: AssignmentType;
  opensAt: Date;
}) {
  return prisma.assignment.findFirst({
    where: {
      classroomId: args.classroomId,
      type: args.type,
      opensAt: args.opensAt,
    },
  });
}

export async function createAssignment(args: {
  classroomId: number;

  type: AssignmentType;
  mode: AssignmentMode;

  targetKind: AssignmentTargetKind;
  operation?: OperationCode | null;

  opensAt: Date;
  closesAt?: Date | null;

  // non-null in schema (default 4)
  windowMinutes?: number;

  // non-null in schema (default 12)
  numQuestions?: number;

  durationMinutes?: number | null;

  scheduleId?: number | null;
  runDate?: Date | null;

  parentAssignmentId?: number | null;
}) {
  return prisma.assignment.create({
    data: {
      classroomId: args.classroomId,

      type: args.type,
      mode: args.mode,
      targetKind: args.targetKind,

      operation: args.operation ?? null,

      opensAt: args.opensAt,
      closesAt: args.closesAt ?? null,

      // IMPORTANT: do not write null to non-null columns
      ...(typeof args.windowMinutes === 'number' ? { windowMinutes: args.windowMinutes } : {}),
      ...(typeof args.numQuestions === 'number' ? { numQuestions: args.numQuestions } : {}),

      durationMinutes: args.durationMinutes ?? null,

      scheduleId: args.scheduleId ?? null,
      runDate: args.runDate ?? null,

      parentAssignmentId: args.parentAssignmentId ?? null,
    },
  });
}

export async function findLatestAssignmentForClassroom(classroomId: number) {
  return prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: [{ opensAt: 'desc' }, { id: 'desc' }],
  });
}

export async function deleteAssignmentsByClassroomId(classroomId: number) {
  return prisma.assignment.deleteMany({
    where: { classroomId },
  });
}

export async function isStudentRecipientForAssignment(params: {
  assignmentId: number;
  studentId: number;
}): Promise<boolean> {
  const row = await prisma.assignmentRecipient.findUnique({
    where: { assignmentId_studentId: params },
    select: { assignmentId: true },
  });

  return !!row;
}
