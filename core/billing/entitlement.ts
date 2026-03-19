import { prisma } from '@/data/prisma';
import type { EntitlementAccessState, EntitlementGateResult, EntitlementSnapshot } from '@/types';

export const TRIAL_LIMITS = {
  classrooms: 1,
  schedulesPerClassroom: 1,
  studentsPerClassroom: 30,
} as const;

export async function getTeacherEntitlement(
  teacherId: number,
): Promise<EntitlementSnapshot | null> {
  const row = await prisma.teacherEntitlement.findUnique({
    where: { teacherId },
    select: {
      plan: true,
      status: true,
      source: true,
      trialEndsAt: true,
      expiresAt: true,
      grantReason: true,
    },
  });

  if (!row) return null;

  return {
    plan: row.plan,
    status: row.status,
    source: row.source,
    trialEndsAt: row.trialEndsAt,
    expiresAt: row.expiresAt,
    grantReason: row.grantReason,
  };
}

export function isEntitlementCurrentlyActive(entitlement: EntitlementSnapshot | null): boolean {
  if (!entitlement) return false;
  if (entitlement.status !== 'ACTIVE') return false;

  const now = Date.now();

  if (entitlement.plan === 'TRIAL') {
    if (entitlement.trialEndsAt && entitlement.trialEndsAt.getTime() <= now) return false;
  }

  if (entitlement.expiresAt && entitlement.expiresAt.getTime() <= now) return false;

  return true;
}

export function toEntitlementAccessState(
  entitlement: EntitlementSnapshot | null,
): EntitlementAccessState | null {
  if (!entitlement) return null;

  const isActive = isEntitlementCurrentlyActive(entitlement);
  const isTrial = entitlement.plan === 'TRIAL';
  const isSchoolPlan = entitlement.plan === 'SCHOOL';
  const hasProAccess = isActive && (entitlement.plan === 'PRO' || entitlement.plan === 'SCHOOL');

  return {
    ...entitlement,
    isActive,
    isTrial,
    hasProAccess,
    isSchoolPlan,
  };
}

export async function getTeacherEntitlementAccessState(
  teacherId: number,
): Promise<EntitlementAccessState | null> {
  const entitlement = await getTeacherEntitlement(teacherId);
  return toEntitlementAccessState(entitlement);
}

export async function requireTeacherActiveEntitlement(
  teacherId: number,
): Promise<EntitlementGateResult> {
  const ent = await getTeacherEntitlement(teacherId);

  if (!isEntitlementCurrentlyActive(ent)) {
    return {
      ok: false,
      status: 402,
      error: 'Your trial has ended. Please upgrade to continue.',
    };
  }

  return { ok: true, entitlement: ent };
}

export async function requireWithinTrialLimits(opts: {
  teacherId: number;
  classroomId?: number;
  kind: 'CREATE_CLASSROOM' | 'CREATE_SCHEDULE' | 'ADD_STUDENTS' | 'CREATE_MANUAL_ASSIGNMENT';
  addStudentsCount?: number;
}): Promise<EntitlementGateResult> {
  const ent = await getTeacherEntitlement(opts.teacherId);

  if (!ent || ent.plan !== 'TRIAL') {
    return { ok: true, entitlement: ent };
  }

  if (!isEntitlementCurrentlyActive(ent)) {
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

    const current = await prisma.student.count({
      where: { classroomId: opts.classroomId },
    });
    const adding = opts.addStudentsCount ?? 0;

    if (current + adding > TRIAL_LIMITS.studentsPerClassroom) {
      return {
        ok: false,
        status: 402,
        error: `Trial limit: ${TRIAL_LIMITS.studentsPerClassroom} students per classroom.`,
      };
    }
  }

  return { ok: true, entitlement: ent };
}
