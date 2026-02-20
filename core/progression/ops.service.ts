import type { OperationCode, ProgressionPolicyDTO, PolicyOps } from '@/types/api/progression';

function isOperationCode(v: unknown): v is OperationCode {
  return v === 'MUL' || v === 'ADD' || v === 'SUB' || v === 'DIV';
}

export function getPolicyOps(
  policy: Pick<ProgressionPolicyDTO, 'enabledOperations' | 'operationOrder'>,
): PolicyOps {
  const enabled = (policy.enabledOperations ?? []).filter(isOperationCode);

  if (enabled.length === 0) {
    throw new Error('Progression policy has no enabled operations');
  }

  const orderRaw =
    policy.operationOrder && policy.operationOrder.length > 0 ? policy.operationOrder : enabled;

  const order = orderRaw.filter(isOperationCode).filter((op) => enabled.includes(op));

  const normalizedOrder = order.length > 0 ? order : enabled;

  return {
    enabledOperations: enabled,
    operationOrder: normalizedOrder,
    primaryOperation: normalizedOrder[0],
  };
}
