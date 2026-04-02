import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import { Prisma } from '@prisma/client';
import { requireTeacherActiveEntitlement } from '@/core';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import type {
  AssignmentMode,
  AssignmentType,
  AssignmentTargetKind,
  OperationCode,
} from '@/types/enums';
import type { AssignmentCoreDTO, ScheduledOccurrenceDetailsDTO } from '@/types';
import { addMinutes } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/**
 * Returns true when the given student is allowed to access the assignment.
 * A student must be in the same classroom; if the assignment is targeted (has
 * explicit recipients) the student must also be on the recipients list.
 */
export function studentCanAccessAssignment(params: {
  assignment: { classroomId: number; recipients: ReadonlyArray<{ studentId: number }> };
  student: { id: number; classroomId: number };
}): boolean {
  const { assignment, student } = params;
  if (assignment.classroomId !== student.classroomId) return false;
  const isTargeted = assignment.recipients.length > 0;
  if (!isTargeted) return true;
  return assignment.recipients.some((r) => r.studentId === student.id);
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

  requiredSets?: number | null;
  minimumScorePercent?: number | null;

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

    requiredSets = null,
    minimumScorePercent = null,

    studentIds,

    scheduleId = null,
    runDate,

    parentAssignmentId = null,
  } = params;

  if (!(opensAt instanceof Date) || Number.isNaN(opensAt.getTime())) {
    throw new ConflictError('Invalid opensAt');
  }

  const closesAt: Date | null = params.closesAt === undefined ? null : (params.closesAt ?? null);

  if (targetKind === 'PRACTICE_TIME') {
    if (!closesAt) {
      throw new ConflictError('closesAt is required for PRACTICE_TIME assignments');
    }
    if (!(closesAt instanceof Date) || Number.isNaN(closesAt.getTime())) {
      throw new ConflictError('Invalid closesAt');
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
    requiredSets: true,
    minimumScorePercent: true,
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
      requiredSets: a.requiredSets ?? null,
      minimumScorePercent: a.minimumScorePercent ?? null,
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

        requiredSets: targetKind === 'PRACTICE_TIME' ? (requiredSets ?? undefined) : undefined,
        minimumScorePercent:
          targetKind === 'PRACTICE_TIME' ? (minimumScorePercent ?? undefined) : undefined,

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

        requiredSets: targetKind === 'PRACTICE_TIME' ? (requiredSets ?? undefined) : undefined,
        minimumScorePercent:
          targetKind === 'PRACTICE_TIME' ? (minimumScorePercent ?? undefined) : undefined,

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
      requiredSets: true,
      minimumScorePercent: true,
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
    requiredSets: latest.requiredSets ?? null,
    minimumScorePercent: latest.minimumScorePercent ?? null,
    scheduleId: latest.scheduleId ?? null,
    runDate: toIso(latest.runDate),
  };
}

function parseRunDateStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function buildOccurrenceTimes(params: {
  runDate: string;
  opensAtLocalTime: string;
  timeZone: string;
  windowMinutes: number;
}) {
  const runDateParts = parseRunDateStart(params.runDate);
  if (!runDateParts) return null;

  const [hoursRaw, minutesRaw] = params.opensAtLocalTime.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const localDateTime = new Date(
    runDateParts.year,
    runDateParts.month - 1,
    runDateParts.day,
    hours,
    minutes,
    0,
    0,
  );

  const opensAt = fromZonedTime(localDateTime, params.timeZone);
  const closesAt = addMinutes(opensAt, params.windowMinutes);

  return {
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
  };
}

export async function getScheduledOccurrenceDetails(params: {
  classroomId: number;
  scheduleId: number;
  runDate: string;
}): Promise<ScheduledOccurrenceDetailsDTO | null> {
  const { classroomId, scheduleId, runDate } = params;

  const parsedRunDate = new Date(runDate);
  if (Number.isNaN(parsedRunDate.getTime())) return null;

  const schedule = await prisma.assignmentSchedule.findFirst({
    where: {
      id: scheduleId,
      classroomId,
    },
    select: {
      id: true,
      classroomId: true,
      isActive: true,
      opensAtLocalTime: true,
      windowMinutes: true,
      targetKind: true,
      type: true,
      numQuestions: true,
      durationMinutes: true,
      operation: true,
      Classroom: {
        select: {
          timeZone: true,
        },
      },
    },
  });

  if (!schedule) return null;

  const timeZone = schedule.Classroom.timeZone || 'America/Los_Angeles';

  const occurrenceTimes = buildOccurrenceTimes({
    runDate,
    opensAtLocalTime: schedule.opensAtLocalTime,
    timeZone,
    windowMinutes: schedule.windowMinutes,
  });

  if (!occurrenceTimes) return null;

  const run = await prisma.assignmentScheduleRun.findUnique({
    where: {
      scheduleId_runDate: {
        scheduleId,
        runDate: parsedRunDate,
      },
    },
    select: {
      assignmentId: true,
      isSkipped: true,
      skippedAt: true,
      skipReason: true,
    },
  });

  let existingAssignmentId = run?.assignmentId ?? null;

  if (!existingAssignmentId) {
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        classroomId,
        scheduleId,
        runDate: parsedRunDate,
      },
      select: {
        id: true,
      },
    });

    existingAssignmentId = existingAssignment?.id ?? null;
  }

  return {
    scheduleId: schedule.id,
    classroomId: schedule.classroomId,
    classroomTimeZone: timeZone,
    runDate,

    isActive: schedule.isActive,
    isSkipped: run?.isSkipped ?? false,
    skippedAt: run?.skippedAt ? run.skippedAt.toISOString() : null,
    skipReason: run?.skipReason ?? null,

    mode: 'SCHEDULED',
    targetKind: schedule.targetKind,
    type: schedule.type,

    opensAt: occurrenceTimes.opensAt,
    closesAt: occurrenceTimes.closesAt,

    windowMinutes: schedule.targetKind === 'PRACTICE_TIME' ? null : schedule.windowMinutes,
    numQuestions: schedule.targetKind === 'PRACTICE_TIME' ? null : schedule.numQuestions,
    durationMinutes:
      schedule.targetKind === 'PRACTICE_TIME' ? (schedule.durationMinutes ?? null) : null,
    operation: schedule.operation,

    existingAssignmentId,
  };
}
