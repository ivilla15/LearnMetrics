import { prisma } from '@/data/prisma';

export type TeacherEntitlementState =
  | { state: 'ACTIVE_TRIAL'; trialEndsAt: Date }
  | { state: 'ACTIVE_PRO' }
  | { state: 'ACTIVE_SCHOOL' }
  | { state: 'EXPIRED' };

const TRIAL_DAYS = 30;

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function ensureTeacherEntitlement(teacherId: number) {
  // Create entitlement row if missing (idempotent)
  const existing = await prisma.teacherEntitlement.findUnique({ where: { teacherId } });
  if (existing) return existing;

  // If teacher is new, start a trial
  const now = new Date();
  const trialEndsAt = addDays(now, TRIAL_DAYS);

  return prisma.teacherEntitlement.create({
    data: {
      teacherId,
      plan: 'TRIAL',
      status: 'ACTIVE',
      trialEndsAt,
    },
  });
}

export async function getTeacherEntitlementState(
  teacherId: number,
): Promise<TeacherEntitlementState> {
  const ent = await ensureTeacherEntitlement(teacherId);

  // Paid plans
  if (ent.status === 'ACTIVE') {
    if (ent.plan === 'PRO') return { state: 'ACTIVE_PRO' };
    if (ent.plan === 'SCHOOL') return { state: 'ACTIVE_SCHOOL' };
  }

  // Trial
  if (ent.plan === 'TRIAL') {
    const ends = ent.trialEndsAt;
    if (!ends) return { state: 'EXPIRED' };
    const now = new Date();
    if (now <= ends && ent.status === 'ACTIVE') return { state: 'ACTIVE_TRIAL', trialEndsAt: ends };
    return { state: 'EXPIRED' };
  }

  return { state: 'EXPIRED' };
}

export function canAccessTeacherApp(state: TeacherEntitlementState) {
  return (
    state.state === 'ACTIVE_TRIAL' ||
    state.state === 'ACTIVE_PRO' ||
    state.state === 'ACTIVE_SCHOOL'
  );
}

export function isTrial(state: TeacherEntitlementState) {
  return state.state === 'ACTIVE_TRIAL';
}
