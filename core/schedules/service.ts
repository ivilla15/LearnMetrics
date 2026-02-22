import { prisma } from '@/data/prisma';

import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';

import {
  ConflictError,
  NotFoundError,
  createScheduledAssignment,
  requireTeacherActiveEntitlement,
} from '@/core';

import {
  getNextScheduledDateForSchedule,
  localDateTimeToUtcRange,
  localDayToUtcDate,
} from '@/utils';

import type { Prisma } from '@prisma/client';
import type { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';
import { type AssignmentType, ScheduleDTO } from '@/types';

function assertOwnsClassroom(classroom: { teacherId: number }, teacherId: number) {
  if (Number(classroom.teacherId) !== Number(teacherId)) {
    throw new ConflictError('You are not allowed to view this classroom');
  }
}

function assertCanModifyClassroom(classroom: { teacherId: number }, teacherId: number) {
  if (Number(classroom.teacherId) !== Number(teacherId)) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }
}

function assertValidDays(days: string[] | undefined | null) {
  if (!days || days.length === 0) {
    throw new ConflictError('Schedule must include at least one day');
  }
}

const scheduleSelect = {
  id: true,
  classroomId: true,
  isActive: true,
  days: true,
  opensAtLocalTime: true,
  windowMinutes: true,

  targetKind: true,

  type: true,
  numQuestions: true,
  operation: true,

  durationMinutes: true,

  dependsOnScheduleId: true,
  offsetMinutes: true,
  recipientRule: true,
} satisfies Prisma.AssignmentScheduleSelect;

function toDTO(
  row: Prisma.AssignmentScheduleGetPayload<{ select: typeof scheduleSelect }>,
): ScheduleDTO {
  return {
    id: row.id,
    classroomId: row.classroomId,

    opensAtLocalTime: row.opensAtLocalTime,
    windowMinutes: row.windowMinutes,
    days: row.days ?? [],
    isActive: row.isActive,

    targetKind: row.targetKind,
    type: row.type ?? null,

    numQuestions: row.numQuestions,
    durationMinutes: row.durationMinutes ?? null,
    operation: row.operation ?? null,

    dependsOnScheduleId: row.dependsOnScheduleId ?? null,
    offsetMinutes: row.offsetMinutes,
    recipientRule: row.recipientRule,
  };
}

export async function getClassroomSchedulesForTeacher(params: {
  teacherId: number;
  classroomId: number;
}): Promise<ScheduleDTO[]> {
  const classroom = await ClassroomsRepo.findClassroomById(params.classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertOwnsClassroom(classroom, params.teacherId);

  const rows = await prisma.assignmentSchedule.findMany({
    where: { classroomId: params.classroomId },
    orderBy: { id: 'asc' },
    select: scheduleSelect,
  });

  return rows.map(toDTO);
}

export async function createAdditionalClassroomSchedule(params: {
  teacherId: number;
  classroomId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const classroom = await ClassroomsRepo.findClassroomById(params.classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, params.teacherId);
  assertValidDays(params.input.days);

  const input = params.input;

  const created = await prisma.assignmentSchedule.create({
    data: {
      classroomId: params.classroomId,
      isActive: input.isActive ?? true,
      days: input.days,
      opensAtLocalTime: input.opensAtLocalTime,
      windowMinutes: input.windowMinutes ?? 4,

      targetKind: input.targetKind,

      // ASSESSMENT uses these; PRACTICE_TIME can still store operation/duration
      type: input.targetKind === 'ASSESSMENT' ? input.type : null,
      numQuestions: input.targetKind === 'ASSESSMENT' ? (input.numQuestions ?? 12) : 0,
      operation: input.operation ?? null,

      durationMinutes: input.targetKind === 'PRACTICE_TIME' ? input.durationMinutes : null,

      dependsOnScheduleId: input.dependsOnScheduleId ?? null,
      offsetMinutes: input.offsetMinutes ?? 0,
      recipientRule: input.recipientRule ?? 'ALL',
    },
    select: scheduleSelect,
  });

  return toDTO(created);
}

export async function updateClassroomScheduleById(params: {
  teacherId: number;
  classroomId: number;
  scheduleId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const classroom = await ClassroomsRepo.findClassroomById(params.classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, params.teacherId);
  assertValidDays(params.input.days);

  const existing = await SchedulesRepo.findScheduleById(params.scheduleId);
  if (!existing || existing.classroomId !== params.classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  const input = params.input;

  const updated = await prisma.assignmentSchedule.update({
    where: { id: existing.id },
    data: {
      isActive: input.isActive ?? existing.isActive,
      days: input.days,
      opensAtLocalTime: input.opensAtLocalTime,
      windowMinutes: input.windowMinutes ?? existing.windowMinutes,

      targetKind: input.targetKind,

      type: input.targetKind === 'ASSESSMENT' ? input.type : null,
      numQuestions: input.targetKind === 'ASSESSMENT' ? (input.numQuestions ?? 12) : 0,
      operation: input.operation ?? null,

      durationMinutes: input.targetKind === 'PRACTICE_TIME' ? input.durationMinutes : null,

      dependsOnScheduleId: input.dependsOnScheduleId ?? null,
      offsetMinutes: input.offsetMinutes ?? 0,
      recipientRule: input.recipientRule ?? 'ALL',
    },
    select: scheduleSelect,
  });

  return toDTO(updated);
}

export async function deleteClassroomScheduleById(params: {
  teacherId: number;
  classroomId: number;
  scheduleId: number;
}): Promise<void> {
  const classroom = await ClassroomsRepo.findClassroomById(params.classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, params.teacherId);

  const existing = await SchedulesRepo.findScheduleById(params.scheduleId);
  if (!existing || existing.classroomId !== params.classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  await SchedulesRepo.deleteScheduleById(existing.id);
}

async function gateScheduleByEntitlement(sched: {
  id: number;
  classroomId: number;
  Classroom: { teacherId: number | null; timeZone: string };
}) {
  const teacherId = sched.Classroom.teacherId;

  if (!teacherId) {
    await prisma.assignmentSchedule.update({ where: { id: sched.id }, data: { isActive: false } });
    return { ok: false as const };
  }

  const gate = await requireTeacherActiveEntitlement(teacherId);

  if (!gate.ok) {
    await prisma.assignmentSchedule.update({ where: { id: sched.id }, data: { isActive: false } });
    return { ok: false as const };
  }

  return { ok: true as const, teacherId };
}

export async function runActiveSchedulesForDate(baseDate: Date = new Date()) {
  const schedules = await SchedulesRepo.findAllActiveSchedulesWithTimezone();
  const results: Array<Awaited<ReturnType<typeof createScheduledAssignment>>> = [];

  for (const sched of schedules) {
    try {
      const gate = await gateScheduleByEntitlement(sched);
      if (!gate.ok) continue;

      const days = Array.isArray(sched.days) ? sched.days : [];
      if (days.length === 0) continue;

      const tz =
        typeof sched.Classroom.timeZone === 'string' ? sched.Classroom.timeZone.trim() : '';
      if (!tz) {
        await prisma.assignmentSchedule.update({
          where: { id: sched.id },
          data: { isActive: false },
        });
        continue;
      }

      const scheduledLocalDate = getNextScheduledDateForSchedule(baseDate, days, tz);
      const runDate = localDayToUtcDate(scheduledLocalDate, tz);

      const effectiveWindow =
        sched.targetKind === 'PRACTICE_TIME'
          ? (sched.durationMinutes ?? sched.windowMinutes)
          : sched.windowMinutes;

      const { opensAtUTC, closesAtUTC } = localDateTimeToUtcRange({
        localDate: scheduledLocalDate,
        localTime: sched.opensAtLocalTime,
        windowMinutes: effectiveWindow,
        tz,
      });

      if (sched.targetKind === 'ASSESSMENT' && !sched.type) {
        await prisma.assignmentSchedule.update({
          where: { id: sched.id },
          data: { isActive: false },
        });
        continue;
      }

      const typeForAssignment: AssignmentType =
        sched.targetKind === 'PRACTICE_TIME' ? 'PRACTICE' : (sched.type as AssignmentType);

      const dto = await createScheduledAssignment({
        teacherId: gate.teacherId,
        classroomId: sched.classroomId,

        scheduleId: sched.id,
        runDate,

        opensAt: opensAtUTC,
        closesAt: closesAtUTC,

        windowMinutes: sched.windowMinutes,

        mode: 'SCHEDULED',
        type: typeForAssignment,

        targetKind: sched.targetKind,
        operation: sched.operation ?? null,

        numQuestions: sched.targetKind === 'ASSESSMENT' ? sched.numQuestions : 0,
        durationMinutes: sched.targetKind === 'PRACTICE_TIME' ? sched.durationMinutes : null,
      });

      results.push(dto);
    } catch (err) {
      if (err instanceof ConflictError && err.message === 'Schedule run was skipped') continue;
      continue;
    }
  }

  return results;
}
