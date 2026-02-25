import type { AttemptSummaryDTO, OperationCode, StudentProgressLiteDTO } from '@/types';

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

  operation: OperationCode;
  level: number;
};
