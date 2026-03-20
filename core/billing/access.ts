import { TRIAL_LIMITS } from '@/core';
import type {
  AssignmentsGate,
  ClassroomsGate,
  EntitlementAccessState,
  FeatureGate,
  ScheduleGate,
  StudentsGate,
} from '@/types';

function getInactiveOrCanceledGate(
  access: EntitlementAccessState | null,
  featureLabel: string,
): FeatureGate | null {
  if (!access || access.isActive) return null;

  const canceled = access.status === 'CANCELED';

  return {
    ok: false,
    message: canceled
      ? `Your subscription is canceled. Upgrade to re-enable ${featureLabel}.`
      : `Your access is no longer active. Upgrade to re-enable ${featureLabel}.`,
    upgradeUrl: canceled ? '/billing?reason=canceled&plan=pro' : '/billing?reason=expired&plan=pro',
  };
}

export function buildSchedulesGate(params: {
  access: EntitlementAccessState | null;
  scheduleCount: number;
}): ScheduleGate {
  const inactiveGate = getInactiveOrCanceledGate(params.access, 'scheduling');
  if (inactiveGate) return inactiveGate;

  if (params.access?.isTrial && params.scheduleCount >= TRIAL_LIMITS.schedulesPerClassroom) {
    return {
      ok: false,
      message: `Trial accounts can create ${TRIAL_LIMITS.schedulesPerClassroom} schedule per classroom. Upgrade to add more schedules.`,
      upgradeUrl: '/billing?plan=pro',
    };
  }

  return { ok: true, message: '' };
}

export function buildClassroomsGate(params: {
  access: EntitlementAccessState | null;
  classroomCount: number;
}): ClassroomsGate {
  const inactiveGate = getInactiveOrCanceledGate(params.access, 'classroom creation');
  if (inactiveGate) return inactiveGate;

  if (params.access?.isTrial && params.classroomCount >= TRIAL_LIMITS.classrooms) {
    return {
      ok: false,
      message: `Trial accounts can create ${TRIAL_LIMITS.classrooms} classroom. Upgrade to create more classrooms.`,
      upgradeUrl: '/billing?plan=pro',
    };
  }

  return { ok: true, message: '' };
}

export function buildStudentsGate(params: {
  access: EntitlementAccessState | null;
  currentStudentCount: number;
  incomingStudentCount?: number;
}): StudentsGate {
  const inactiveGate = getInactiveOrCanceledGate(params.access, 'student management');
  if (inactiveGate) return inactiveGate;

  const incomingStudentCount = params.incomingStudentCount ?? 0;
  const nextCount = params.currentStudentCount + incomingStudentCount;

  if (params.access?.isTrial && nextCount > TRIAL_LIMITS.studentsPerClassroom) {
    return {
      ok: false,
      message: `Trial accounts can have up to ${TRIAL_LIMITS.studentsPerClassroom} students per classroom. Upgrade to add more students.`,
      upgradeUrl: '/billing?plan=pro',
    };
  }

  return { ok: true, message: '' };
}

export function buildAssignmentsGate(params: {
  access: EntitlementAccessState | null;
}): AssignmentsGate {
  const inactiveGate = getInactiveOrCanceledGate(params.access, 'assignments');
  if (inactiveGate) return inactiveGate;

  return { ok: true, message: '' };
}
