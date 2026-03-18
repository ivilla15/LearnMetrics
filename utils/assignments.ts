import { isProjection } from './calendar';

export function getAssignment<
  TAssignment,
  TItem extends { kind: string } = TAssignment & { kind: string },
>(selected: (TAssignment | TItem) | null): TAssignment | null {
  if (!selected) return null;
  return isProjection(selected as { kind: string }) ? null : (selected as TAssignment);
}

export function getStatus(params: { opensAt: Date; closesAt: Date | null; now: Date }) {
  const { opensAt, closesAt, now } = params;
  if (now < opensAt) return 'NOT_OPEN' as const;
  if (closesAt && now > closesAt) return 'CLOSED' as const;
  return 'OPEN' as const;
}
