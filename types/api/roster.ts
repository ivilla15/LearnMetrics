import type { AttemptSummaryDTO } from '@/types/api/attempts';

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
