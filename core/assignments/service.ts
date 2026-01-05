// src/core/assignments/service.ts
import * as AssignmentsRepo from '@/data/assignments.repo';
import { SCHEDULE_KIND } from '@/data/assignments.repo';
import { getNextScheduledDate, localDateTimeToUtcRange, TZ } from '@/utils/time';

export type AssignmentDTO = {
  id: number;
  classroomId: number;
  kind: 'SCHEDULED_TEST';
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  opensAtLocal: string;
  closesAtLocal: string;
  windowMinutes: number;
  numQuestions: number;
  wasCreated: boolean;
};

type Params = {
  classroomId: number;
  scheduleDate?: string;
  opensAtLocalTime?: string;
  windowMinutes?: number;
  numQuestions?: number;
  assignmentMode?: 'SCHEDULED' | 'MANUAL'; // ✅ NEW
};

export type LatestAssignmentDTO = {
  id: number;
  classroomId: number;
  kind: string;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number;
  numQuestions: number;
};

export async function createScheduledAssignment(params: Params): Promise<AssignmentDTO> {
  const {
    classroomId,
    scheduleDate,
    opensAtLocalTime = '08:00',
    windowMinutes = 4,
    numQuestions = 12,
    assignmentMode = 'SCHEDULED',
  } = params;

  const safeNumQuestions = Math.min(numQuestions, 12);

  const localDate = scheduleDate ?? getNextScheduledDate(new Date(), TZ);

  const { opensAtUTC, closesAtUTC, opensAtLocalISO, closesAtLocalISO } = localDateTimeToUtcRange({
    localDate,
    localTime: opensAtLocalTime,
    windowMinutes,
    tz: TZ,
  });

  const existing = await AssignmentsRepo.findByClassroomKindAndOpensAt({
    classroomId,
    kind: SCHEDULE_KIND,
    opensAt: opensAtUTC,
  });

  if (existing) {
    return {
      id: existing.id,
      classroomId: existing.classroomId,
      kind: 'SCHEDULED_TEST',
      assignmentMode: existing.assignmentMode as 'SCHEDULED' | 'MANUAL',
      numQuestions: existing.numQuestions,
      opensAt: existing.opensAt.toISOString(),
      closesAt: existing.closesAt.toISOString(),
      opensAtLocal: opensAtLocalISO,
      closesAtLocal: closesAtLocalISO,
      windowMinutes: existing.windowMinutes,
      wasCreated: false,
    };
  }

  const created = await AssignmentsRepo.create({
    classroomId,
    kind: SCHEDULE_KIND,
    assignmentMode,
    opensAt: opensAtUTC,
    closesAt: closesAtUTC,
    windowMinutes,
    numQuestions: safeNumQuestions,
  });

  return {
    id: created.id,
    classroomId: created.classroomId,
    kind: 'SCHEDULED_TEST',
    assignmentMode: created.assignmentMode as 'SCHEDULED' | 'MANUAL',
    opensAt: created.opensAt.toISOString(),
    closesAt: created.closesAt.toISOString(),
    opensAtLocal: opensAtLocalISO,
    closesAtLocal: closesAtLocalISO,
    windowMinutes: created.windowMinutes,
    numQuestions: created.numQuestions,
    wasCreated: true,
  };
}

export async function getLatestAssignmentForClassroom(
  classroomId: number,
): Promise<LatestAssignmentDTO | null> {
  const assignment = await AssignmentsRepo.findLatestForClassroom(classroomId);
  if (!assignment) return null;

  return {
    id: assignment.id,
    classroomId: assignment.classroomId,
    kind: assignment.kind,
    assignmentMode: assignment.assignmentMode as 'SCHEDULED' | 'MANUAL',
    opensAt: assignment.opensAt.toISOString(),
    closesAt: assignment.closesAt.toISOString(),
    windowMinutes: assignment.windowMinutes,
    numQuestions: assignment.numQuestions,
  };
}
