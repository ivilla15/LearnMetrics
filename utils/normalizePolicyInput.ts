import type {
  OperationCode,
  ProgressionPolicyInput,
  ModifierRule,
  ProgressionPolicyDTO,
} from '../types';
import { clamp } from './math';

export function uniqOps(ops: OperationCode[]): OperationCode[] {
  const out: OperationCode[] = [];
  const seen = new Set<OperationCode>();
  for (const op of ops) {
    if (!seen.has(op)) {
      seen.add(op);
      out.push(op);
    }
  }
  return out;
}

export function normalizeOrder(enabled: OperationCode[], order: OperationCode[]) {
  const enabledSet = new Set(enabled);
  const cleaned = uniqOps(order).filter((op) => enabledSet.has(op));

  // ensure all enabled ops appear in order
  for (const op of enabled) {
    if (!cleaned.includes(op)) cleaned.push(op);
  }

  return cleaned;
}

export function normalizeRule(
  enabled: OperationCode[],
  maxNumber: number,
  rule: ModifierRule,
): ModifierRule {
  const enabledSet = new Set(enabled);

  return {
    modifier: rule.modifier,
    operations: uniqOps(rule.operations).filter((op) => enabledSet.has(op)),
    minLevel: clamp(rule.minLevel, 1, maxNumber),
    propagate: !!rule.propagate,
    enabled: !!rule.enabled,
  };
}

export function normalizePolicyInput(input: ProgressionPolicyInput): ProgressionPolicyInput {
  const enabledOperations = uniqOps(input.enabledOperations);
  const maxNumber = clamp(input.maxNumber, 1, 100);

  const operationOrder = normalizeOrder(enabledOperations, input.operationOrder);

  const modifierRules = (input.modifierRules ?? [])
    .map((r) => normalizeRule(enabledOperations, maxNumber, r))
    .filter((r) => r.operations.length > 0);

  return {
    enabledOperations,
    operationOrder,
    maxNumber,
    modifierRules,
  };
}

export function toInput(dto: ProgressionPolicyDTO): ProgressionPolicyInput {
  return {
    enabledOperations: dto.enabledOperations,
    operationOrder: dto.operationOrder,
    maxNumber: dto.maxNumber,
    modifierRules: dto.modifierRules,
  };
}

export function isEqual(a: ProgressionPolicyInput, b: ProgressionPolicyInput) {
  return JSON.stringify(a) === JSON.stringify(b);
}
