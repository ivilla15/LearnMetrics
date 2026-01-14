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
