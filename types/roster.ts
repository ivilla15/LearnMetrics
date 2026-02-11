import type { AttemptSummary } from './attempts';

export type StudentRosterRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  mustSetPassword: boolean;
  lastAttempt: AttemptSummary | null;
};

export type StudentRosterRowDTO = Omit<StudentRosterRow, 'lastAttempt'> & {
  lastAttempt: AttemptSummary | null;
};
