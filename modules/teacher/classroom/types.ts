export type Classroom = { id: number; name?: string };

export type StudentRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  mustSetPassword: boolean;
  lastAttempt: null | {
    assignmentId: number;
    score: number;
    total: number;
    percent: number;
    completedAt: string;
    wasMastery: boolean;
  };
};

export type SetupCodeRow = {
  studentId: number;
  username: string;
  setupCode: string;
  expiresAt?: string;
  name?: string;
};
