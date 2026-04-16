import type { AttemptSummaryDTO, StudentProgressLiteDTO } from '@/types';
import type { DomainCode } from '@/types/domain';

export type RosterClassroomDTO = {
  id: number;
  name: string;
  timeZone?: string | null;
};

export type RosterStudentRowDTO = {
  id: number;
  name: string;
  username: string;
  mustSetPassword: boolean;
  lastAttempt: AttemptSummaryDTO | null;

  // Domain-keyed progress rows (one per DomainCode).
  progress: StudentProgressLiteDTO[];
};

export type ProgressRosterDTO = {
  classroom: RosterClassroomDTO;
  students: RosterStudentRowDTO[];
  warning?: string;
};

export type SetupCodeCardDTO = {
  studentId: number;
  username: string;
  setupCode: string;
  expiresAt: string;
  name?: string;
};

export type BulkAddResponseDTO = {
  setupCodes: SetupCodeCardDTO[];
  students: RosterStudentRowDTO[];
};

export type RosterEditingStateDTO = {
  id: number;
  name: string;
  username: string;

  domain: DomainCode;
  level: number;
};
