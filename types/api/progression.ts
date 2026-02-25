import {
  MODIFIER_CODES,
  OPERATION_CODES,
  type ModifierCode,
  type OperationCode,
} from '@/types/enums';
import { clamp } from '@/utils';

export type StudentProgressLiteDTO = {
  operation: OperationCode;
  level: number;
};

export type ModifierRuleDTO = {
  modifier: ModifierCode;
  operations: OperationCode[];
  minLevel: number;
  propagate: boolean;
  enabled: boolean;
};

export type ProgressionPolicyInputDTO = {
  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  maxNumber: number;
  modifierRules: ModifierRuleDTO[];
};

export type ProgressionPolicyDTO = ProgressionPolicyInputDTO & {
  classroomId: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgressionSnapshotDTO = {
  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  primaryOperation: OperationCode;
  maxNumber: number;
};

export type PromotionResultDTO = {
  promoted: boolean;
  operation: OperationCode;
  level: number;
  movedToOperation?: OperationCode;
};

export function getLevelForOp(
  progress: ReadonlyArray<{ operation: OperationCode; level: number }>,
  op: OperationCode,
): number {
  const row = progress.find((p) => p.operation === op);
  return row?.level ?? 1;
}

export function toInput(policy: ProgressionPolicyDTO): ProgressionPolicyInputDTO {
  return {
    enabledOperations: policy.enabledOperations,
    operationOrder: policy.operationOrder,
    maxNumber: policy.maxNumber,
    modifierRules: policy.modifierRules,
  };
}

function uniqOps(ops: OperationCode[]) {
  const seen = new Set<OperationCode>();
  const out: OperationCode[] = [];
  for (const op of ops) {
    if (!seen.has(op)) {
      seen.add(op);
      out.push(op);
    }
  }
  return out;
}

function ensureRule(mod: ModifierCode, rules: ModifierRuleDTO[]): ModifierRuleDTO {
  const existing = rules.find((r) => r.modifier === mod);
  return (
    existing ?? {
      modifier: mod,
      operations: [],
      minLevel: 1,
      propagate: false,
      enabled: false,
    }
  );
}

export function normalizePolicyInput(input: ProgressionPolicyInputDTO): ProgressionPolicyInputDTO {
  const enabledRaw = Array.isArray(input.enabledOperations) ? input.enabledOperations : [];
  const enabledFiltered = enabledRaw.filter((x) =>
    (OPERATION_CODES as readonly string[]).includes(x),
  ) as OperationCode[];
  const enabledOperations = uniqOps(enabledFiltered);
  if (enabledOperations.length === 0) enabledOperations.push('MUL');

  const orderRaw = Array.isArray(input.operationOrder) ? input.operationOrder : [];
  const orderFiltered = orderRaw.filter((op) => enabledOperations.includes(op));
  const order = uniqOps(orderFiltered);
  for (const op of enabledOperations) {
    if (!order.includes(op)) order.push(op);
  }

  const maxNumberRaw = Number(input.maxNumber);
  const maxNumber =
    Number.isFinite(maxNumberRaw) && maxNumberRaw >= 1 ? Math.trunc(maxNumberRaw) : 12;

  const rulesRaw = Array.isArray(input.modifierRules) ? input.modifierRules : [];
  const modifierRules: ModifierRuleDTO[] = (MODIFIER_CODES as readonly ModifierCode[])
    .map((m) => ensureRule(m, rulesRaw))
    .map((r) => ({
      ...r,
      operations: r.operations.filter((op) => enabledOperations.includes(op)),
      minLevel: clamp(r.minLevel, 1, maxNumber),
      enabled: !!r.enabled,
      propagate: !!r.propagate,
    }));

  return {
    enabledOperations,
    operationOrder: order,
    maxNumber,
    modifierRules,
  };
}
