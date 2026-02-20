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
