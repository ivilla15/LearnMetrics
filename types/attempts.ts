export type AttemptDetailItem = {
  id: number;
  prompt: string;
  studentAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export type AttemptDetailForModal = {
  attemptId: number;
  completedAt: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  items: AttemptDetailItem[];
};

export type AttemptRow = {
  attemptId: number;
  assignmentId: number;
  completedAt: string;
  assignmentKind: string;
  assignmentMode: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
};

export type AttemptDetail = {
  attemptId: number;
  completedAt: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  assignment?: {
    kind: string;
    assignmentMode: string;
    opensAt: string;
    closesAt: string;
    windowMinutes: number | null;
  };
  items: AttemptDetailItem[];
};

export type AttemptResultsFilterKey = string;

export type AttemptResultsFilterOption = {
  key: AttemptResultsFilterKey;
  label: string;
};

export type AttemptResultsRow = {
  studentId?: number;
  name?: string;
  username?: string;

  attemptId: number | null;

  completedAt: string | null;
  score: number | null;
  total: number | null;
  percent: number | null;
  missed: number | null;
  wasMastery: boolean | null;
  levelAtTime: number | null;
};

export type AttemptExplorerFilter = 'ALL' | 'MASTERY' | 'NOT_MASTERY';

export type AttemptExplorerMe = { id: number; name: string; username: string };

export type AttemptSummary = {
  id: number;
  assignmentId: number;
  score: number;
  total: number;
  completedAt: string; // ISO
};
