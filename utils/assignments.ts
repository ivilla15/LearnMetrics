import { isProjection } from './calendar';

export function getAssignment<
  TAssignment,
  TItem extends { kind: string } = TAssignment & { kind: string },
>(selected: (TAssignment | TItem) | null): TAssignment | null {
  if (!selected) return null;
  return isProjection(selected as { kind: string }) ? null : (selected as TAssignment);
}
