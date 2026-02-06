import type { EntitlementDTO } from '@/types';

export function getBillingUi(e: EntitlementDTO | null | undefined) {
  const plan = e?.plan ?? 'TRIAL';
  const status = e?.status ?? 'ACTIVE';

  if (status === 'CANCELED') {
    return { badge: 'Canceled', tone: 'neutral', cta: 'Manage billing' as const };
  }
  if (status === 'EXPIRED') {
    return { badge: 'Expired', tone: 'destructive', cta: 'Upgrade' as const };
  }
  if (plan === 'TRIAL') {
    return { badge: 'Trial', tone: 'warning', cta: 'Upgrade' as const };
  }
  return { badge: 'Active', tone: 'success', cta: 'Manage billing' as const };
}
