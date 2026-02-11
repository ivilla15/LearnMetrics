import { prisma } from '@/data';
import { NotFoundError, ConflictError } from '@/core';
import { Prisma } from '@prisma/client';
import { requireTeacherActiveEntitlement } from '@/core/billing/entitlement';

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
  skipReason?: string;

  scheduleId?: number | null;
  runDate?: Date;
};

export type CoreAssignmentDTO = {
  id: number;
  classroomId: number;
  kind: string;
  opensAt: string; // ISO
  closesAt: string; // ISO
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
  recipientCount: number;
};

type CoreAssignmentRow = Prisma.AssignmentGetPayload<{
  select: {
    id: true;
    classroomId: true;
    kind: true;
    opensAt: true;
    closesAt: true;
    windowMinutes: true;
    assignmentMode: true;
    numQuestions: true;
    _count: { select: { recipients: true } };
  };
}>;

function toDto(a: CoreAssignmentRow): CoreAssignmentDTO {
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

export async function createScheduledAssignment(params: Params): Promise<CoreAssignmentDTO> {
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

    scheduleId = null,
    runDate,
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

  if (typeof scheduleId === 'number' && (!runDate || Number.isNaN(runDate.getTime()))) {
    throw new ConflictError('runDate is required when scheduleId is provided');
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');

  const entGate = await requireTeacherActiveEntitlement(classroom.teacherId);
  if (!entGate.ok) {
    throw new ConflictError(entGate.error);
  }

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

  const selectAssignment = {
    id: true,
    classroomId: true,
    kind: true,
    opensAt: true,
    closesAt: true,
    windowMinutes: true,
    assignmentMode: true,
    numQuestions: true,
    _count: { select: { recipients: true } },
  } satisfies Prisma.AssignmentSelect;

  // If not from a schedule run, create directly
  if (scheduleId == null) {
    const created: CoreAssignmentRow = await prisma.assignment.create({
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
      select: selectAssignment,
    });

    return toDto(created);
  }

  // ---- schedule-run path (idempotent via assignmentScheduleRun) ----
  const dto = await prisma.$transaction(async (tx) => {
    const run = await tx.assignmentScheduleRun.upsert({
      where: {
        scheduleId_runDate: { scheduleId, runDate: runDate! },
      },
      update: {},
      create: {
        scheduleId,
        runDate: runDate!,
      },
      select: { id: true, assignmentId: true, isSkipped: true },
    });

    if (run.isSkipped) {
      console.info(
        `Schedule ${scheduleId} run ${runDate!.toISOString()} is marked skipped, not creating assignment`,
      );
      throw new ConflictError('Schedule run was skipped');
    }

    if (run.assignmentId) {
      const existing = await tx.assignment.findUnique({
        where: { id: run.assignmentId },
        select: selectAssignment,
      });

      if (existing) return toDto(existing as CoreAssignmentRow);

      await tx.assignmentScheduleRun.update({
        where: { id: run.id },
        data: { assignmentId: null },
      });
    }

    let created: CoreAssignmentRow;

    try {
      created = await tx.assignment.create({
        data: {
          classroomId,
          opensAt,
          closesAt,
          windowMinutes: windowMinutes ?? 4,
          assignmentMode,
          numQuestions,
          kind,
          questionSetId: questionSetId ?? undefined,
          scheduleId,
          runDate: runDate!,
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
        select: selectAssignment,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await tx.assignment.findFirst({
          where: { scheduleId, opensAt },
          select: selectAssignment,
        });

        if (!existing) throw err;
        created = existing as CoreAssignmentRow;
      } else {
        throw err;
      }
    }

    await tx.assignmentScheduleRun.update({
      where: { id: run.id },
      data: { assignmentId: created.id },
    });

    return toDto(created);
  });

  return dto;
}

export async function getLatestAssignmentForClassroom(
  classroomId: number,
): Promise<CoreAssignmentDTO | null> {
  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    throw new ConflictError('Invalid classroomId');
  }

  const latest: CoreAssignmentRow | null = await prisma.assignment.findFirst({
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
