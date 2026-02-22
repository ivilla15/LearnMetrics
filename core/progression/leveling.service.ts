import type { StudentProgressLiteDTO } from '@/types/api/progression';
import type { OperationCode } from '@/types/enums';
import { clampInt } from '@/utils/math';

export function distributeLevelAcrossOperations(params: {
  operationOrder: OperationCode[];
  primaryOp: OperationCode;
  maxNumber: number;
  levelAmount: number;
}): StudentProgressLiteDTO[] {
  const order = params.operationOrder.length ? params.operationOrder : [params.primaryOp];
  const idx = Math.max(
    0,
    order.findIndex((o) => o === params.primaryOp),
  );
  const n = order.length;

  let remaining = Math.max(0, Math.trunc(params.levelAmount));
  const maxNumber = clampInt(params.maxNumber, 1, 100);

  const out: StudentProgressLiteDTO[] = [];

  for (let i = 0; i < n && remaining > 0; i++) {
    const op = order[(idx + i) % n];
    const take = Math.min(maxNumber, remaining);
    out.push({ operation: op, level: clampInt(take, 1, maxNumber) });
    remaining -= take;
  }

  if (out.length === 0) out.push({ operation: params.primaryOp, level: 1 });

  return out;
}
