// src/core/assignments/service.ts
import * as AssignmentsRepo from '@/data/assignments.repo';
import { FRIDAY_KIND } from '@/data/assignments.repo';
import { nextFridayLocalDate, localDateTimeToUtcRange, TZ } from '@/utils/time';

// Keep the response shape simple and stable for your handler
export type AssignmentDTO = {
  id: number;
  classroomId: number;
  kind: 'FRIDAY_TEST';
  mode: 'SCHEDULED' | 'MANUAL'; // 👈 NEW
  opensAt: string; // UTC ISO
  closesAt: string; // UTC ISO
  opensAtLocal: string; // PT ISO with offset
  closesAtLocal: string; // PT ISO with offset
  windowMinutes: number;
  wasCreated: boolean;
};

type Params = {
  classroomId: number;
  fridayDate?: string; // "YYYY-MM-DD" (PT)
  opensAtLocalTime?: string; // "HH:mm" (PT)
  windowMinutes?: number; // default 4
};

export type LatestAssignmentDTO = {
  id: number;
  classroomId: number;
  kind: string;
  mode: 'SCHEDULED' | 'MANUAL'; // 👈 NEW
  opensAt: string; // UTC ISO
  closesAt: string; // UTC ISO
  windowMinutes: number;
};

export async function createFridayAssignment(params: Params): Promise<AssignmentDTO> {
  const { classroomId, fridayDate, opensAtLocalTime = '08:00', windowMinutes = 4 } = params;

  // 👇 Determine if caller provided explicit timing info
  const hasManualTiming =
    !!fridayDate || params.opensAtLocalTime !== undefined || params.windowMinutes !== undefined;

  const mode: 'SCHEDULED' | 'MANUAL' = hasManualTiming ? 'MANUAL' : 'SCHEDULED';

  // 1) Choose the PT calendar date to use (given or next Friday)
  const localDate = fridayDate ?? nextFridayLocalDate(new Date(), TZ);

  // 2) Convert local PT date+time → UTC instants (+ readable local strings)
  const { opensAtUTC, closesAtUTC, opensAtLocalISO, closesAtLocalISO } = localDateTimeToUtcRange({
    localDate,
    localTime: opensAtLocalTime,
    windowMinutes,
    tz: TZ,
  });

  // 3) Idempotency check by composite unique (classroomId, kind, opensAt)
  const existing = await AssignmentsRepo.findByClassroomKindAndOpensAt({
    classroomId,
    kind: FRIDAY_KIND,
    opensAt: opensAtUTC,
  });

  if (existing) {
    return {
      id: existing.id,
      classroomId: existing.classroomId,
      kind: 'FRIDAY_TEST',
      mode: (existing.mode ?? 'SCHEDULED') as 'SCHEDULED' | 'MANUAL', // 👈 NEW
      opensAt: existing.opensAt.toISOString(),
      closesAt: existing.closesAt.toISOString(),
      opensAtLocal: opensAtLocalISO,
      closesAtLocal: closesAtLocalISO,
      windowMinutes: existing.windowMinutes,
      wasCreated: false,
    };
  }

  // 4) Create a new assignment row
  const created = await AssignmentsRepo.create({
    classroomId,
    kind: FRIDAY_KIND,
    assignmentMode: mode,
    opensAt: opensAtUTC,
    closesAt: closesAtUTC,
    windowMinutes,
  });

  // 5) Return the DTO the API expects
  return {
    id: created.id,
    classroomId: created.classroomId,
    kind: 'FRIDAY_TEST',
    mode: (created.mode ?? mode) as 'SCHEDULED' | 'MANUAL', // 👈 NEW
    opensAt: created.opensAt.toISOString(),
    closesAt: created.closesAt.toISOString(),
    opensAtLocal: opensAtLocalISO,
    closesAtLocal: closesAtLocalISO,
    windowMinutes: created.windowMinutes,
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
    mode: (assignment.mode ?? 'SCHEDULED') as 'SCHEDULED' | 'MANUAL', // 👈 NEW
    opensAt: assignment.opensAt.toISOString(),
    closesAt: assignment.closesAt.toISOString(),
    windowMinutes: assignment.windowMinutes,
  };
}
