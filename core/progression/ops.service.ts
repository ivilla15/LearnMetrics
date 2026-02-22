import { OPERATION_CODES, type OperationCode } from '@/types/enums';
import type { ProgressionPolicyDTO } from '@/types/api/progression';

export function getPolicyOps(
  policy: Pick<ProgressionPolicyDTO, 'enabledOperations' | 'operationOrder'>,
) {
  const enabled = (policy.enabledOperations ?? []).filter((op): op is OperationCode =>
    OPERATION_CODES.includes(op),
  );

  if (enabled.length === 0) {
    throw new Error('Progression policy has no enabled operations');
  }

  const orderRaw =
    policy.operationOrder && policy.operationOrder.length > 0 ? policy.operationOrder : enabled;

  const order = orderRaw
    .filter((op): op is OperationCode => OPERATION_CODES.includes(op))
    .filter((op) => enabled.includes(op));

  const normalizedOrder = order.length > 0 ? order : enabled;

  return {
    enabledOperations: enabled,
    operationOrder: normalizedOrder,
    primaryOperation: normalizedOrder[0],
  };
}
