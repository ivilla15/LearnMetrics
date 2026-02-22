import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import { Prisma } from '@prisma/client';
import { requireTeacherActiveEntitlement } from '@/core/billing/entitlement';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import type {
  AssignmentMode,
  AssignmentType,
  AssignmentTargetKind,
  OperationCode,
} from '@/types/enums';
import type { AssignmentCoreDTO } from '@/types';

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export async function createScheduledAssignment(params: {
  teacherId: number;
  classroomId: number;

  opensAt: Date;
  closesAt?: Date | null;
  windowMinutes: number | null;

  mode: AssignmentMode;
  type: AssignmentType;

  targetKind?: AssignmentTargetKind;
  operation?: OperationCode | null;

  numQuestions?: number;
  durationMinutes?: number | null;

  studentIds?: number[];

  scheduleId?: number | null;
  runDate?: Date;

  parentAssignmentId?: number | null;
}): Promise<AssignmentCoreDTO> {
  const {
    teacherId,
    classroomId,
    opensAt,
    windowMinutes,

    mode,
    type,

    targetKind = 'ASSESSMENT',
    operation = null,

    numQuestions = 12,
    durationMinutes = null,

    studentIds,

    scheduleId = null,
    runDate,

    parentAssignmentId = null,
  } = params;

  if (!(opensAt instanceof Date) || Number.isNaN(opensAt.getTime())) {
    throw new ConflictError('Invalid opensAt');
  }

  let closesAt: Date | null = params.closesAt === undefined ? null : (params.closesAt ?? null);

  if (targetKind === 'PRACTICE_TIME') {
    if (
      typeof durationMinutes !== 'number' ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      throw new ConflictError('durationMinutes is required for PRACTICE_TIME assignments');
    }

    if (!closesAt) {
      closesAt = new Date(opensAt.getTime() + durationMinutes * 60 * 1000);
    }
  } else {
    // ASSESSMENT
    if (!closesAt) {
      throw new ConflictError('closesAt is required for ASSESSMENT assignments');
    }
    if (!(closesAt instanceof Date) || Number.isNaN(closesAt.getTime())) {
      throw new ConflictError('Invalid closesAt');
    }
  }

  if (closesAt && closesAt <= opensAt) {
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

  await assertTeacherOwnsClassroom(teacherId, classroomId);

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
    targetKind: true,
    operation: true,
    opensAt: true,
    closesAt: true,
    windowMinutes: true,
    numQuestions: true,
    durationMinutes: true,
    scheduleId: true,
    runDate: true,
  } satisfies Prisma.AssignmentSelect;

  const toDto = (
    a: Prisma.AssignmentGetPayload<{ select: typeof selectAssignment }>,
  ): AssignmentCoreDTO => {
    return {
      id: a.id,
      classroomId: a.classroomId,
      type: a.type,
      mode: a.mode,
      targetKind: a.targetKind,
      operation: a.operation ?? null,
      opensAt: a.opensAt.toISOString(),
      closesAt: toIso(a.closesAt),
      windowMinutes: a.windowMinutes,
      numQuestions: a.numQuestions ?? 12,
      durationMinutes: a.durationMinutes ?? null,
      scheduleId: a.scheduleId ?? null,
      runDate: toIso(a.runDate),
    };
  };

  // direct create (not schedule-run)
  if (scheduleId == null) {
    const created = await prisma.assignment.create({
      data: {
        classroomId,
        opensAt,
        closesAt: closesAt ?? undefined,
        windowMinutes: windowMinutes ?? 4,
        mode,
        type,
        targetKind,
        operation: operation ?? undefined,

        numQuestions: targetKind === 'ASSESSMENT' ? numQuestions : 0,
        durationMinutes:
          targetKind === 'PRACTICE_TIME' ? (durationMinutes ?? undefined) : undefined,

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

  // schedule-run path (idempotent)
  return prisma.$transaction(async (tx) => {
    const run = await tx.assignmentScheduleRun.upsert({
      where: { scheduleId_runDate: { scheduleId, runDate: runDate! } },
      update: {},
      create: { scheduleId, runDate: runDate! },
      select: { id: true, assignmentId: true, isSkipped: true },
    });

    if (run.isSkipped) throw new ConflictError('Schedule run was skipped');

    if (run.assignmentId) {
      const existing = await tx.assignment.findUnique({
        where: { id: run.assignmentId },
        select: selectAssignment,
      });

      if (existing) return toDto(existing);

      await tx.assignmentScheduleRun.update({
        where: { id: run.id },
        data: { assignmentId: null },
      });
    }

    const created = await tx.assignment.create({
      data: {
        classroomId,
        opensAt,
        closesAt: closesAt ?? undefined,
        windowMinutes: windowMinutes ?? 4,
        mode,
        type,
        targetKind,
        operation: operation ?? undefined,

        numQuestions: targetKind === 'ASSESSMENT' ? numQuestions : 0,
        durationMinutes:
          targetKind === 'PRACTICE_TIME' ? (durationMinutes ?? undefined) : undefined,

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
}

export async function getLatestAssignmentForClassroom(
  classroomId: number,
): Promise<AssignmentCoreDTO | null> {
  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    throw new ConflictError('Invalid classroomId');
  }

  const latest = await prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
    select: {
      id: true,
      classroomId: true,
      type: true,
      mode: true,
      targetKind: true,
      operation: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
      durationMinutes: true,
      scheduleId: true,
      runDate: true,
    } satisfies Prisma.AssignmentSelect,
  });

  if (!latest) return null;

  return {
    id: latest.id,
    classroomId: latest.classroomId,
    type: latest.type,
    mode: latest.mode,
    targetKind: latest.targetKind,
    operation: latest.operation ?? null,
    opensAt: latest.opensAt.toISOString(),
    closesAt: toIso(latest.closesAt),
    windowMinutes: latest.windowMinutes,
    numQuestions: latest.numQuestions ?? 12,
    durationMinutes: latest.durationMinutes ?? null,
    scheduleId: latest.scheduleId ?? null,
    runDate: toIso(latest.runDate),
  };
}
