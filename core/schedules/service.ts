import { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as ClassroomsRepo from '@/data/classrooms.repo';
import { NotFoundError, ConflictError } from '@/core/errors';
import { createScheduledAssignment, AssignmentDTO } from '@/core/assignments/service';
import { getNextScheduledDate, TZ } from '@/utils/time';

export type ScheduleDTO = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
  numQuestions: number;
};

export async function getClassroomScheduleForTeacher(params: {
  teacherId: number;
  classroomId: number;
}): Promise<ScheduleDTO | null> {
  const { teacherId, classroomId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  const classroomOwnerId = Number(classroom.teacherId);
  const requesterId = Number(teacherId);

  if (!Number.isFinite(requesterId) || classroomOwnerId !== requesterId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  const existing = await SchedulesRepo.findByClassroomId(classroomId);
  if (!existing) return null;

  return {
    id: existing.id,
    classroomId: existing.classroomId,
    opensAtLocalTime: existing.opensAtLocalTime,
    windowMinutes: existing.windowMinutes,
    isActive: existing.isActive,
    days: existing.days ?? [],
    numQuestions: existing.numQuestions,
  };
}

/**
 * NEW: get *all* schedules for this classroom, not just the first one.
 */
export async function getClassroomSchedulesForTeacher(params: {
  teacherId: number;
  classroomId: number;
}): Promise<ScheduleDTO[]> {
  const { teacherId, classroomId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  const classroomOwnerId = Number(classroom.teacherId);
  const requesterId = Number(teacherId);

  if (!Number.isFinite(requesterId) || classroomOwnerId !== requesterId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  const rows = await SchedulesRepo.findAllByClassroomId(classroomId);

  return rows.map((row) => ({
    id: row.id,
    classroomId: row.classroomId,
    opensAtLocalTime: row.opensAtLocalTime,
    windowMinutes: row.windowMinutes,
    isActive: row.isActive,
    days: row.days ?? [],
    numQuestions: row.numQuestions,
  }));
}

export async function upsertClassroomSchedule(params: {
  teacherId: number;
  classroomId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, input } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }

  // basic guard so we don't hit NOT NULL errors
  if (!input.days || input.days.length === 0) {
    throw new ConflictError('Schedule must include at least one day');
  }

  const existing = await SchedulesRepo.findByClassroomId(classroomId);

  if (!existing) {
    const created = await SchedulesRepo.createSchedule({
      classroomId,
      opensAtLocalTime: input.opensAtLocalTime,
      windowMinutes: input.windowMinutes ?? 4,
      isActive: input.isActive ?? true,
      days: input.days,
      numQuestions: input.numQuestions ?? 12,
    });

    return {
      id: created.id,
      classroomId: created.classroomId,
      opensAtLocalTime: created.opensAtLocalTime,
      windowMinutes: created.windowMinutes,
      isActive: created.isActive,
      days: created.days ?? [],
      numQuestions: created.numQuestions,
    };
  }

  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
    days: input.days ?? existing.days,
    numQuestions: input.numQuestions ?? 12,
  });

  return {
    id: updated.id,
    classroomId: updated.classroomId,
    opensAtLocalTime: updated.opensAtLocalTime,
    windowMinutes: updated.windowMinutes,
    isActive: updated.isActive,
    days: updated.days ?? [],
    numQuestions: updated.numQuestions,
  };
}

/**
 * NEW: always create an additional schedule row (no upsert).
 * This is what the "Create new weekly test schedule" button will call.
 */
export async function createAdditionalClassroomSchedule(params: {
  teacherId: number;
  classroomId: number;
  input: UpsertScheduleInput;
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, input } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }

  if (!input.days || input.days.length === 0) {
    throw new ConflictError('Schedule must include at least one day');
  }

  const created = await SchedulesRepo.createSchedule({
    classroomId,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? 4,
    isActive: input.isActive ?? true,
    days: input.days,
    numQuestions: input.numQuestions ?? 12,
  });

  return {
    id: created.id,
    classroomId: created.classroomId,
    opensAtLocalTime: created.opensAtLocalTime,
    windowMinutes: created.windowMinutes,
    isActive: created.isActive,
    days: created.days ?? [],
    numQuestions: created.numQuestions,
  };
}

/**
 * Run all active schedules for a given "today" date.
 * (We can later filter by `days`; for now we just keep behavior simple.)
 */
export async function runActiveSchedulesForDate(
  baseDate: Date = new Date(),
): Promise<AssignmentDTO[]> {
  const schedules = await SchedulesRepo.findAllActive();
  const results: AssignmentDTO[] = [];

  const scheduleLocalDate = getNextScheduledDate(baseDate, TZ);

  for (const sched of schedules) {
    const dto = await createScheduledAssignment({
      classroomId: sched.classroomId,
      scheduleDate: scheduleLocalDate,
      opensAtLocalTime: sched.opensAtLocalTime,
      windowMinutes: sched.windowMinutes,
      numQuestions: sched.numQuestions,
      assignmentMode: 'SCHEDULED',
    });

    results.push(dto);
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
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }

  // Make sure this schedule actually belongs to this classroom
  const existing = await SchedulesRepo.findById(scheduleId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  if (!input.days || input.days.length === 0) {
    throw new ConflictError('Schedule must include at least one day');
  }

  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    opensAtLocalTime: input.opensAtLocalTime ?? existing.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
    days: input.days ?? existing.days,
    numQuestions: input.numQuestions ?? 12,
  });

  return {
    id: updated.id,
    classroomId: updated.classroomId,
    opensAtLocalTime: updated.opensAtLocalTime,
    windowMinutes: updated.windowMinutes,
    isActive: updated.isActive,
    days: updated.days ?? [],
    numQuestions: updated.numQuestions,
  };
}

export async function deleteClassroomScheduleById(params: {
  teacherId: number;
  classroomId: number;
  scheduleId: number;
}): Promise<void> {
  const { teacherId, classroomId, scheduleId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }

  const existing = await SchedulesRepo.findById(scheduleId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Schedule not found for this classroom');
  }

  await SchedulesRepo.deleteSchedule(existing.id);
}
