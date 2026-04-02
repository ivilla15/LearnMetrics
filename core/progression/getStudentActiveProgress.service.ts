import type { OperationCode } from '@/types/enums';
import type { ModifierRuleDTO, ProgressionSnapshotDTO } from '@/types/api/progression';
import * as StudentProgressRepo from '@/data';

function getProgressionOrder(snapshot: ProgressionSnapshotDTO): OperationCode[] {
  if (snapshot.operationOrder.length > 0) return snapshot.operationOrder;
  if (snapshot.enabledOperations.length > 0) return snapshot.enabledOperations;
  return ['MUL'];
}

function computeActiveOpAndLevel(params: {
  progress: Array<{ operation: OperationCode; level: number }>;
  snapshot: ProgressionSnapshotDTO;
}): { operation: OperationCode; level: number } {
  const { progress, snapshot } = params;

  const order = getProgressionOrder(snapshot);

  const byOp = new Map<OperationCode, number>();
  for (const row of progress) {
    byOp.set(row.operation, row.level);
  }

  for (const op of order) {
    const lvl = byOp.get(op) ?? 1;
    if (lvl < snapshot.maxNumber) return { operation: op, level: lvl };
  }

  const last = order[order.length - 1] ?? 'MUL';
  return { operation: last, level: byOp.get(last) ?? snapshot.maxNumber };
}

function ruleAppliesToOperation(params: {
  rule: ModifierRuleDTO;
  operation: OperationCode;
  snapshot: ProgressionSnapshotDTO;
}): { applies: boolean; exact: boolean } {
  const { rule, operation, snapshot } = params;

  if (!rule.enabled) {
    return { applies: false, exact: false };
  }

  if (rule.operations.includes(operation)) {
    return { applies: true, exact: true };
  }

  if (!rule.propagate) {
    return { applies: false, exact: false };
  }

  const order = getProgressionOrder(snapshot);
  const targetIndex = order.indexOf(operation);

  if (targetIndex === -1) {
    return { applies: false, exact: false };
  }

  for (const sourceOp of rule.operations) {
    const sourceIndex = order.indexOf(sourceOp);
    if (sourceIndex !== -1 && sourceIndex < targetIndex) {
      return { applies: true, exact: false };
    }
  }

  return { applies: false, exact: false };
}

function compareModifierPriority(
  a: { rule: ModifierRuleDTO; exact: boolean },
  b: { rule: ModifierRuleDTO; exact: boolean },
): number {
  if (a.exact !== b.exact) {
    return a.exact ? 1 : -1;
  }

  if (a.rule.minLevel !== b.rule.minLevel) {
    return a.rule.minLevel - b.rule.minLevel;
  }

  if (a.rule.modifier !== b.rule.modifier) {
    if (a.rule.modifier === 'FRACTION') return 1;
    if (b.rule.modifier === 'FRACTION') return -1;
  }

  return 0;
}

export function resolveModifierForOperationLevel(params: {
  operation: OperationCode;
  level: number;
  snapshot: ProgressionSnapshotDTO;
}): 'DECIMAL' | 'FRACTION' | null {
  const { operation, level, snapshot } = params;

  const matches: Array<{ rule: ModifierRuleDTO; exact: boolean }> = [];

  for (const rule of snapshot.modifierRules) {
    if (!rule.enabled) continue;
    if (level < rule.minLevel) continue;

    const applied = ruleAppliesToOperation({
      rule,
      operation,
      snapshot,
    });

    if (!applied.applies) continue;

    matches.push({ rule, exact: applied.exact });
  }

  if (matches.length === 0) return null;

  matches.sort(compareModifierPriority);
  return matches[matches.length - 1]?.rule.modifier ?? null;
}

export async function getStudentActiveProgress(params: {
  studentId: number;
  snapshot: ProgressionSnapshotDTO;
}): Promise<{ operation: OperationCode; level: number; modifier: 'DECIMAL' | 'FRACTION' | null }> {
  const rows = await StudentProgressRepo.findByStudentId(params.studentId);

  const active = computeActiveOpAndLevel({
    progress: rows,
    snapshot: params.snapshot,
  });

  const modifier = resolveModifierForOperationLevel({
    operation: active.operation,
    level: active.level,
    snapshot: params.snapshot,
  });

  return {
    ...active,
    modifier,
  };
}
