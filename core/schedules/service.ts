// core/schedules/service.ts
import type { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';

import { ConflictError, NotFoundError } from '@/core/errors';
import { createScheduledAssignment } from '@/core/assignments/service';
import type { AssignmentDTO } from '@/core/assignments/service';

import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';

import {
  getNextScheduledDateForSchedule,
  localDateTimeToUtcRange,
  localDayToUtcDate,
  TZ,
} from '@/utils/time';

export type ScheduleDTO = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
  numQuestions: number;
};

function assertOwnsClassroom(classroom: { teacherId: number }, teacherId: number) {
  const ownerId = Number(classroom.teacherId);
  const requesterId = Number(teacherId);
  if (!Number.isFinite(requesterId) || ownerId !== requesterId) {
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

function toDTO(row: {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[] | null;
  numQuestions: number;
}): ScheduleDTO {
  return {
    id: row.id,
    classroomId: row.classroomId,
    opensAtLocalTime: row.opensAtLocalTime,
    windowMinutes: row.windowMinutes,
    isActive: row.isActive,
    days: row.days ?? [],
    numQuestions: row.numQuestions,
  };
}

export async function getClassroomScheduleForTeacher(params: {
  teacherId: number;
  classroomId: number;
}): Promise<ScheduleDTO | null> {
  const { teacherId, classroomId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertOwnsClassroom(classroom, teacherId);

  const existing = await SchedulesRepo.findPrimaryScheduleByClassroomId(classroomId);
  return existing ? toDTO(existing) : null;
}

export async function getClassroomSchedulesForTeacher(params: {
  teacherId: number;
  classroomId: number;
}): Promise<ScheduleDTO[]> {
  const { teacherId, classroomId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertOwnsClassroom(classroom, teacherId);

  const rows = await SchedulesRepo.findAllSchedulesByClassroomId(classroomId);
  return rows.map(toDTO);
}

export async function upsertClassroomSchedule(params: {
  teacherId: number;
  classroomId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, input } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, teacherId);
  assertValidDays(input.days);

  const existing = await SchedulesRepo.findPrimaryScheduleByClassroomId(classroomId);

  if (!existing) {
    const created = await SchedulesRepo.createSchedule({
      classroomId,
      opensAtLocalTime: input.opensAtLocalTime,
      windowMinutes: input.windowMinutes ?? 4,
      isActive: input.isActive ?? true,
      days: input.days,
      numQuestions: input.numQuestions ?? 12,
    });

    return toDTO(created);
  }

  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
    days: input.days ?? existing.days ?? [],
    numQuestions: input.numQuestions ?? existing.numQuestions,
  });

  return toDTO(updated);
}

export async function createAdditionalClassroomSchedule(params: {
  teacherId: number;
  classroomId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, input } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, teacherId);
  assertValidDays(input.days);

  const created = await SchedulesRepo.createSchedule({
    classroomId,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? 4,
    isActive: input.isActive ?? true,
    days: input.days,
    numQuestions: input.numQuestions ?? 12,
  });

  return toDTO(created);
}

export async function runActiveSchedulesForDate(
  baseDate: Date = new Date(),
): Promise<AssignmentDTO[]> {
  const schedules = await SchedulesRepo.findAllActiveSchedulesWithTimezone();
  const results: AssignmentDTO[] = [];

  for (const sched of schedules) {
    try {
      const days = Array.isArray(sched.days) ? sched.days : [];
      if (days.length === 0) {
        // Nothing configured for this schedule — skip it.
        console.warn(`Skipping schedule ${sched.id} (no days configured)`);
        continue;
      }

      const tz = sched.Classroom?.timeZone ?? TZ;

      // 1) Determine the scheduled local day (YYYY-MM-DD) for THIS schedule in THIS classroom timezone
      const scheduledLocalDate = getNextScheduledDateForSchedule(baseDate, days, tz);

      // 2) Idempotency key (same schedule + same local day) in THIS classroom timezone
      const runDate = localDayToUtcDate(scheduledLocalDate, tz);

      // 3) Build opens/closes in UTC correctly for THIS classroom timezone
      const { opensAtUTC, closesAtUTC } = localDateTimeToUtcRange({
        localDate: scheduledLocalDate,
        localTime: sched.opensAtLocalTime, // "HH:mm"
        windowMinutes: sched.windowMinutes,
        tz,
      });

      // 4) Create assignment (service handles idempotency via schedule run)
      const dto = await createScheduledAssignment({
        classroomId: sched.classroomId,
        scheduleId: sched.id,
        runDate,
        opensAt: opensAtUTC,
        closesAt: closesAtUTC,
        windowMinutes: sched.windowMinutes,
        numQuestions: sched.numQuestions,
        assignmentMode: 'SCHEDULED',
      });

      results.push(dto);
    } catch (err) {
      // Log and continue — don't let one bad schedule stop the runner.
      // If you have a logging/monitoring service, send the error there instead.
      console.error(`Failed to process schedule ${sched.id}:`, err);
      continue;
    }
  }

  return results;
}

export async function updateClassroomScheduleById(params: {
  teacherId: number;
  classroomId: number;
  scheduleId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, scheduleId, input } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, teacherId);
  assertValidDays(input.days);

  const existing = await SchedulesRepo.findScheduleById(scheduleId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    opensAtLocalTime: input.opensAtLocalTime ?? existing.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
    days: input.days ?? existing.days ?? [],
    numQuestions: input.numQuestions ?? existing.numQuestions,
  });

  return toDTO(updated);
}

export async function deleteClassroomScheduleById(params: {
  teacherId: number;
  classroomId: number;
  scheduleId: number;
}): Promise<void> {
  const { teacherId, classroomId, scheduleId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  assertCanModifyClassroom(classroom, teacherId);

  const existing = await SchedulesRepo.findScheduleById(scheduleId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  await SchedulesRepo.deleteScheduleById(existing.id);
}
