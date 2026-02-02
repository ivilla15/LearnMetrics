import { TeacherEntitlement } from '@prisma/client';

export function isTrialLocked(
  ent: Pick<TeacherEntitlement, 'plan' | 'status' | 'trialEndsAt'> | null,
) {
  if (!ent) return false;
  if (ent.status !== 'ACTIVE') return true;
  if (ent.plan !== 'TRIAL') return false;
  if (!ent.trialEndsAt) return false;
  return ent.trialEndsAt.getTime() <= Date.now();
}
