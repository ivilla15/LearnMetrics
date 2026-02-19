import type { OperationCode, ProgressionPolicyDTO, PolicyOps } from '@/types/progression';

export function getPolicyOps(
  policy: Pick<ProgressionPolicyDTO, 'enabledOperations' | 'operationOrder'>,
): PolicyOps {
  const enabled = (policy.enabledOperations ?? []).slice();

  const order =
    policy.operationOrder && policy.operationOrder.length > 0
      ? policy.operationOrder.slice()
      : enabled.slice();

  const primary = (order[0] ?? enabled[0]) as OperationCode;

  return {
    enabledOperations: enabled,
    operationOrder: order,
    primaryOperation: primary,
  };
}
