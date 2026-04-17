import type { DomainCode } from '@/types/domain';

export type StudentProgressLiteDTO = {
  domain: DomainCode;
  level: number;
};

export type ProgressionPolicyInputDTO = {
  enabledDomains: DomainCode[];
  maxNumber: number;
};

export type ProgressionModifier = 'DECIMAL' | 'FRACTION' | null;

export type ProgressionPolicyDTO = ProgressionPolicyInputDTO & {
  classroomId: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgressionSnapshotDTO = {
  enabledDomains: DomainCode[];
  maxNumber: number;
};

export type PromotionResultDTO = {
  promoted: boolean;
  domain: DomainCode;
  level: number;
  movedToDomain?: DomainCode;
};
