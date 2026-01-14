import { prisma } from '@/data';
import { NotFoundError, ConflictError } from '@/core';

export type AssignmentDTO = {
  id: number;
  classroomId: number;
  kind: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
  recipientCount: number;
};

type Params = {
  classroomId: number;
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions?: number;
  kind?: 'SCHEDULED_TEST';
  questionSetId?: number | null;
  studentIds?: number[];
};

type AssignmentRow = {
  id: number;
  classroomId: number;
  kind: 'SCHEDULED_TEST';
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
  _count: { recipients: number };
};

function toDto(a: AssignmentRow): AssignmentDTO {
  return {
    id: a.id,
    classroomId: a.classroomId,
    kind: a.kind,
    opensAt: a.opensAt.toISOString(),
    closesAt: a.closesAt.toISOString(),
    windowMinutes: a.windowMinutes,
    assignmentMode: a.assignmentMode,
    numQuestions: a.numQuestions,
    recipientCount: a._count.recipients,
  };
}

export async function createScheduledAssignment(params: Params): Promise<AssignmentDTO> {
  const {
    classroomId,
    opensAt,
    closesAt,
    windowMinutes,
    assignmentMode,
    numQuestions = 12,
    kind = 'SCHEDULED_TEST',
    questionSetId = null,
    studentIds,
  } = params;

  if (!(opensAt instanceof Date) || Number.isNaN(opensAt.getTime())) {
    throw new ConflictError('Invalid opensAt');
  }
  if (!(closesAt instanceof Date) || Number.isNaN(closesAt.getTime())) {
    throw new ConflictError('Invalid closesAt');
  }
  if (closesAt <= opensAt) {
    throw new ConflictError('closesAt must be after opensAt');
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');

  let normalizedStudentIds: number[] | null = null;

  if (Array.isArray(studentIds)) {
    const uniq = Array.from(new Set(studentIds)).filter((n) => Number.isFinite(n) && n > 0);
    if (uniq.length === 0) throw new ConflictError('studentIds must include at least one student');

    const found = await prisma.student.findMany({
      where: { id: { in: uniq }, classroomId },
      select: { id: true },
    });

    if (found.length !== uniq.length) {
      throw new ConflictError('One or more selected students are not in this classroom');
    }

    normalizedStudentIds = uniq;
  }

  const created: AssignmentRow = await prisma.assignment.create({
    data: {
      classroomId,
      opensAt,
      closesAt,
      windowMinutes: windowMinutes ?? 4,
      assignmentMode,
      numQuestions,
      kind,
      questionSetId: questionSetId ?? undefined,
      ...(normalizedStudentIds
        ? {
            recipients: {
              createMany: {
                data: normalizedStudentIds.map((sid) => ({ studentId: sid })),
                skipDuplicates: true,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      classroomId: true,
      kind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      assignmentMode: true,
      numQuestions: true,
      _count: { select: { recipients: true } },
    },
  });

  return toDto(created);
}

export async function getLatestAssignmentForClassroom(
  classroomId: number,
): Promise<AssignmentDTO | null> {
  const latest: AssignmentRow | null = await prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
    select: {
      id: true,
      classroomId: true,
      kind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      assignmentMode: true,
      numQuestions: true,
      _count: { select: { recipients: true } },
    },
  });

  return latest ? toDto(latest) : null;
}
