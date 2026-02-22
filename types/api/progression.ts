import type { ModifierCode, OperationCode } from '@/types/enums';

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
  createdAt: string; // ISO
  updatedAt: string; // ISO
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
