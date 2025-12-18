import { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as ClassroomsRepo from '@/data/classrooms.repo';
import { NotFoundError, ConflictError } from '@/core/errors';
import { createFridayAssignment, AssignmentDTO } from '@/core/assignments/service';
import { nextFridayLocalDate, TZ } from '@/utils/time';

export type ScheduleDTO = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
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
  };
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
    });

    return {
      id: created.id,
      classroomId: created.classroomId,
      opensAtLocalTime: created.opensAtLocalTime,
      windowMinutes: created.windowMinutes,
      isActive: created.isActive,
      days: created.days ?? [],
    };
  }

  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
    days: input.days ?? existing.days,
  });

  return {
    id: updated.id,
    classroomId: updated.classroomId,
    opensAtLocalTime: updated.opensAtLocalTime,
    windowMinutes: updated.windowMinutes,
    isActive: updated.isActive,
    days: updated.days ?? [],
  };
}

/**
 * Run all active schedules for a given "today" date.
 * (We can later filter by `days`; for now we just keep behavior simple.)
 */
export async function runSchedulesForDate(baseDate: Date = new Date()): Promise<AssignmentDTO[]> {
  const schedules = await SchedulesRepo.findAllActive();
  const results: AssignmentDTO[] = [];

  const fridayLocalDate = nextFridayLocalDate(baseDate, TZ);

  for (const sched of schedules) {
    const dto = await createFridayAssignment({
      classroomId: sched.classroomId,
      fridayDate: fridayLocalDate,
      opensAtLocalTime: sched.opensAtLocalTime,
      windowMinutes: sched.windowMinutes,
    });

    results.push(dto);
  }

  return results;
}
