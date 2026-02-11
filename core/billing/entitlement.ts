// core/billing/entitlements.ts
import { prisma } from '@/data/prisma';

export const TRIAL_LIMITS = {
  classrooms: 1,
  schedulesPerClassroom: 1,
  studentsPerClassroom: 30,
} as const;

export type EntitlementSnapshot = {
  plan: 'TRIAL' | 'PRO' | 'SCHOOL';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  trialEndsAt: Date | null;
};

export type EntitlementGateOk = {
  ok: true;
  entitlement: EntitlementSnapshot | null;
};

export type EntitlementGateFail = {
  ok: false;
  status: number; // use 402 consistently for paywall
  error: string;
};

export type EntitlementGateResult = EntitlementGateOk | EntitlementGateFail;

export function isEntitlementActive(e: EntitlementSnapshot | null): boolean {
  // If there's no entitlement row yet, treat as allowed (you can change later).
  if (!e) return true;

  if (e.status !== 'ACTIVE') return false;

  // PRO/SCHOOL active => allowed
  if (e.plan !== 'TRIAL') return true;

  // TRIAL active => check trial end if present
  if (!e.trialEndsAt) return true;
  return e.trialEndsAt.getTime() > Date.now();
}

export async function getTeacherEntitlement(
  teacherId: number,
): Promise<EntitlementSnapshot | null> {
  const row = await prisma.teacherEntitlement.findUnique({
    where: { teacherId },
    select: { plan: true, status: true, trialEndsAt: true },
  });

  if (!row) return null;

  return {
    plan: row.plan,
    status: row.status,
    trialEndsAt: row.trialEndsAt,
  };
}

/**
 * Require entitlement to be active (blocks when expired/canceled).
 * Returns { ok: true, entitlement } or { ok: false, status, error }.
 */
export async function requireTeacherActiveEntitlement(
  teacherId: number,
): Promise<EntitlementGateResult> {
  const ent = await getTeacherEntitlement(teacherId);

  if (!isEntitlementActive(ent)) {
    return {
      ok: false,
      status: 402,
      error: 'Your trial has ended. Please upgrade to continue.',
    };
  }

  return { ok: true, entitlement: ent };
}

/** Trial caps and checks used during TRIAL only. */
export async function requireWithinTrialLimits(opts: {
  teacherId: number;
  classroomId?: number;
  kind: 'CREATE_CLASSROOM' | 'CREATE_SCHEDULE' | 'ADD_STUDENTS' | 'CREATE_MANUAL_ASSIGNMENT';
  addStudentsCount?: number;
}): Promise<EntitlementGateResult> {
  const ent = await getTeacherEntitlement(opts.teacherId);

  // If no entitlement row or plan !== TRIAL => no caps
  if (!ent || ent.plan !== 'TRIAL') return { ok: true, entitlement: ent ?? null };

  // If trial expired/canceled => block everything
  if (!isEntitlementActive(ent)) {
    return {
      ok: false,
      status: 402,
      error: 'Your trial has ended. Please upgrade to continue.',
    };
  }

  if (opts.kind === 'CREATE_CLASSROOM') {
    const count = await prisma.classroom.count({ where: { teacherId: opts.teacherId } });
    if (count >= TRIAL_LIMITS.classrooms) {
      return {
        ok: false,
        status: 402,
        error: `Trial limit: ${TRIAL_LIMITS.classrooms} classroom.`,
      };
    }
  }

  if (opts.kind === 'CREATE_SCHEDULE') {
    if (!opts.classroomId) {
      return { ok: false, status: 500, error: 'Missing classroomId' };
    }

    const count = await prisma.assignmentSchedule.count({
      where: { classroomId: opts.classroomId },
    });

    if (count >= TRIAL_LIMITS.schedulesPerClassroom) {
      return {
        ok: false,
        status: 402,
        error: `Trial limit: ${TRIAL_LIMITS.schedulesPerClassroom} schedule per classroom.`,
      };
    }
  }

  if (opts.kind === 'ADD_STUDENTS') {
    if (!opts.classroomId) {
      return { ok: false, status: 500, error: 'Missing classroomId' };
    }

    const current = await prisma.student.count({ where: { classroomId: opts.classroomId } });
    const adding = opts.addStudentsCount ?? 0;

    if (current + adding > TRIAL_LIMITS.studentsPerClassroom) {
      return {
        ok: false,
        status: 402,
        error: `Trial limit: ${TRIAL_LIMITS.studentsPerClassroom} students per classroom.`,
      };
    }
  }

  if (opts.kind === 'CREATE_MANUAL_ASSIGNMENT') {
  }

  return { ok: true, entitlement: ent };
}
