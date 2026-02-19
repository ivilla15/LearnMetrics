import type { OperationCode } from '@/types/progression';

export type LevelWrite = { operation: OperationCode; level: number };

export function distributeLevelAcrossOperations(params: {
  operationOrder: OperationCode[];
  primaryOp: OperationCode;
  maxNumber: number;
  levelAmount: number;
}): LevelWrite[] {
  const { operationOrder, primaryOp, maxNumber } = params;
  const levelAmount = params.levelAmount;

  const order = operationOrder.length ? operationOrder : [primaryOp];
  const idx = Math.max(
    0,
    order.findIndex((o) => o === primaryOp),
  );
  const n = order.length;

  let remaining = Math.max(0, levelAmount);
  const out: LevelWrite[] = [];

  for (let i = 0; i < n && remaining > 0; i++) {
    const op = order[(idx + i) % n];
    const take = Math.min(maxNumber, remaining);
    out.push({ operation: op, level: Math.max(1, take) });
    remaining -= take;
  }

  if (out.length === 0) out.push({ operation: primaryOp, level: 1 });

  return out;
}
