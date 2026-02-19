// core/assignments/createScheduledAssignment.ts
import { prisma } from '@/data';
import { NotFoundError, ConflictError } from '@/core';
import { Prisma } from '@prisma/client';
import { requireTeacherActiveEntitlement } from '@/core/billing/entitlement';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';

type Params = {
  teacherId: number;
  classroomId: number;
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number | null;

  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';

  numQuestions?: number;
  questionSetId?: number | null;
  studentIds?: number[];
  skipReason?: string;

  scheduleId?: number | null;
  runDate?: Date;

  parentAssignmentId?: number | null;
};

export type CoreAssignmentDTO = {
  id: number;
  classroomId: number;

  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';

  opensAt: string; // ISO
  closesAt: string | null; // ISO (nullable)
  windowMinutes: number | null;
  numQuestions: number;
  recipientCount: number;

  scheduleId: number | null;
  runDate: string | null; // ISO (nullable)
};

type CoreAssignmentRow = Prisma.AssignmentGetPayload<{
  select: {
    id: true;
    classroomId: true;
    type: true;
    mode: true;
    opensAt: true;
    closesAt: true;
    windowMinutes: true;
    numQuestions: true;
    scheduleId: true;
    runDate: true;
    _count: { select: { recipients: true } };
  };
}>;

function toDto(a: CoreAssignmentRow): CoreAssignmentDTO {
  return {
    id: a.id,
    classroomId: a.classroomId,
    type: a.type,
    mode: a.mode,
    opensAt: a.opensAt.toISOString(),
    closesAt: a.closesAt ? a.closesAt.toISOString() : null,
    windowMinutes: a.windowMinutes,
    // default numQuestions to 12 if DB value is null/undefined
    numQuestions: a.numQuestions ?? 12,
    recipientCount: a._count.recipients ?? 0,
    scheduleId: a.scheduleId ?? null,
    runDate: a.runDate ? a.runDate.toISOString() : null,
  };
}

export async function createScheduledAssignment(params: Params): Promise<CoreAssignmentDTO> {
  const {
    teacherId,
    classroomId,
    opensAt,
    closesAt,
    windowMinutes,
    mode,
    type,
    numQuestions = 12,
    questionSetId = null,
    studentIds,

    scheduleId = null,
    runDate,

    parentAssignmentId = null,
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

  // ownership check: the caller's teacherId must match the classroom teacherId
  await assertTeacherOwnsClassroom(teacherId, classroomId);

  // entitlement: confirm the teacher (owner of the classroom) has active entitlement
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
    type: true,
    mode: true,
    opensAt: true,
    closesAt: true,
    windowMinutes: true,
    numQuestions: true,
    scheduleId: true,
    runDate: true,
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
        mode,
        type,
        numQuestions,
        questionSetId: questionSetId ?? undefined,
        parentAssignmentId: parentAssignmentId ?? undefined,
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
      // don't create assignment if run explicitly skipped
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

    const created: CoreAssignmentRow = await tx.assignment.create({
      data: {
        classroomId,
        opensAt,
        closesAt,
        windowMinutes: windowMinutes ?? 4,
        mode,
        type,
        numQuestions,
        questionSetId: questionSetId ?? undefined,
        scheduleId,
        runDate: runDate!,
        parentAssignmentId: parentAssignmentId ?? undefined,
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
      type: true,
      mode: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
      scheduleId: true,
      runDate: true,
      _count: { select: { recipients: true } },
    },
  });

  return latest ? toDto(latest) : null;
}
