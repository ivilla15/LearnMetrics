export type AttemptSummary = {
  id: number;
  assignmentId: number;
  score: number;
  total: number;
  completedAt: Date;
};

// For API responses / client (JSON can’t carry Date)
export type AttemptSummaryDTO = Omit<AttemptSummary, 'completedAt'> & {
  completedAt: string;
};

export type AttemptDetailDTO = {
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
  items: Array<{
    id: number;
    prompt: string;
    studentAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
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
  items: {
    id: number;
    prompt: string;
    studentAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
};
