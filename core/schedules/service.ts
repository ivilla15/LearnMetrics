// src/core/schedules/service.ts

import { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as ClassroomsRepo from '@/data/classrooms.repo';
import { NotFoundError, ConflictError } from '@/core/errors';
import { createFridayAssignment, AssignmentDTO } from '@/core/assignments/service';
import { nextFridayLocalDate, TZ } from '@/utils/time';

export type ScheduleDTO = {
  id: number;
  classroomId: number;
  questionSetId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
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

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  const existing = await SchedulesRepo.findByClassroomId(classroomId);
  if (!existing) return null;

  return {
    id: existing.id,
    classroomId: existing.classroomId,
    questionSetId: existing.questionSetId,
    opensAtLocalTime: existing.opensAtLocalTime,
    windowMinutes: existing.windowMinutes,
    isActive: existing.isActive,
  };
}

/**
 * A teacher can create or update the weekly schedule for a classroom.
 * Only one schedule per classroom is allowed.
 */
export async function upsertClassroomSchedule(params: {
  teacherId: number; // comes from auth
  classroomId: number; // comes from route param
  input: UpsertScheduleInput; // validated body
}): Promise<ScheduleDTO> {
  const { teacherId, classroomId, input } = params;

  // 1) Classroom must exist
  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  // 2) Teacher must own the classroom
  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to modify this classroom');
  }

  // 3) Check if a schedule already exists
  const existing = await SchedulesRepo.findByClassroomId(classroomId);

  if (!existing) {
    // 4a) No schedule → create one
    const created = await SchedulesRepo.createSchedule({
      classroomId,
      questionSetId: input.questionSetId,
      opensAtLocalTime: input.opensAtLocalTime,
      windowMinutes: input.windowMinutes ?? 4,
      isActive: input.isActive ?? true,
    });

    return {
      id: created.id,
      classroomId: created.classroomId,
      questionSetId: created.questionSetId,
      opensAtLocalTime: created.opensAtLocalTime,
      windowMinutes: created.windowMinutes,
      isActive: created.isActive,
    };
  }

  // 4b) Schedule exists → update it
  const updated = await SchedulesRepo.updateSchedule({
    id: existing.id,
    questionSetId: input.questionSetId,
    opensAtLocalTime: input.opensAtLocalTime,
    windowMinutes: input.windowMinutes ?? existing.windowMinutes,
    isActive: input.isActive ?? existing.isActive,
  });

  return {
    id: updated.id,
    classroomId: updated.classroomId,
    questionSetId: updated.questionSetId,
    opensAtLocalTime: updated.opensAtLocalTime,
    windowMinutes: updated.windowMinutes,
    isActive: updated.isActive,
  };
}

/**
 * Run all active schedules for a given "today" date.
 * For each schedule:
 *  - compute the Friday date (in PT) based on `baseDate`
 *  - call createFridayAssignment(...) to ensure there's an Assignment
 * Because createFridayAssignment is idempotent, this can be safely
 * called multiple times for the same baseDate.
 */
export async function runSchedulesForDate(baseDate: Date = new Date()): Promise<AssignmentDTO[]> {
  // 1) Load all active schedules
  const schedules = await SchedulesRepo.findAllActive();

  const results: AssignmentDTO[] = [];

  // 2) Compute the PT Friday date once for this run
  const fridayLocalDate = nextFridayLocalDate(baseDate, TZ);

  // 3) For each schedule, create (or reuse) the Friday assignment
  for (const sched of schedules) {
    const dto = await createFridayAssignment({
      classroomId: sched.classroomId,
      questionSetId: sched.questionSetId,
      fridayDate: fridayLocalDate, // "YYYY-MM-DD"
      opensAtLocalTime: sched.opensAtLocalTime, // "HH:mm"
      windowMinutes: sched.windowMinutes,
    });

    results.push(dto);
  }

  return results;
}
