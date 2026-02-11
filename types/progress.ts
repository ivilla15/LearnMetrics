import { SetupCodeRow } from './classroom';

export type Filter = 'ALL' | 'MASTERY' | 'NOT_MASTERY' | 'MISSING';

export type Trend = 'improving' | 'regressing' | 'flat' | 'insufficient';

export type StudentFlags = {
  atRisk?: boolean;
  stale14Days?: boolean;
  nonMasteryStreak2?: boolean;
  needsSetup?: boolean;
  missedLastTest?: boolean;
  lastTestAttempted?: boolean;
  lastTestMastery?: boolean;
};

export type StudentRow = {
  id: number;
  name: string;
  username: string;
  level: number;

  lastAttemptAt: string | null;
  lastPercent: number | null;

  attemptsInRange?: number;
  avgPercentInRange: number | null;
  masteryRateInRange: number | null;

  masteryStreak: number;
  nonMasteryStreak: number;

  trendLast3: Trend;
  flags?: StudentFlags;
};

export type FocusStudent = {
  id: number;
  name: string;
  username: string;
  level: number;
  lastAttemptAt: string | null;
};

export type LastTest = {
  assignmentId: number;
  opensAt: string;
  mode: string;
  numQuestions: number;
  masteryRate: number;
  attemptedCount: number;
  avgPercent: number;
  missedCount?: number;
};

export type MissedFact = {
  questionId: number;
  factorA: number;
  factorB: number;
  answer: number;
  incorrectCount: number;
  totalCount: number;
  errorRate: number;
};

export type ScoreBucket = { label: string; count: number };
export type LevelBucket = { level: number; count: number };

export type ClassroomProgressDTO = {
  range: { days: number };
  summary?: {
    atRiskCount?: number;
    nonMasteryStreak2Count?: number;
    missedLastTestCount?: number | null;
    lowestRecentPercent?: number | null;
    masteryRateInRange?: number;
    avgPercentInRange?: number;
    highestLevel?: number | null;
    attemptsInRange?: number;
    studentsTotal?: number;
  };
  focus?: { students?: FocusStudent[] };
  recent?: { last3Tests?: LastTest[] };
  insights?: { topMissedFacts?: MissedFact[] };
  charts?: { scoreBuckets?: ScoreBucket[]; levelBuckets?: LevelBucket[] };
  students?: StudentRow[];
};

export type FilterKey =
  | 'all'
  | 'atRisk'
  | 'stale14'
  | 'streak2'
  | 'masteryStreak2'
  | 'needsSetup'
  | 'improving'
  | 'regressing'
  | 'missedLastTest';

export type FactDetailStudentRow = {
  studentId: number;
  name: string;
  username: string;
  incorrectCount: number;
  totalCount: number;
};

export type FactDetailDTO = {
  questionId: number;
  days: number;
  totalIncorrect: number;
  totalAttempts: number;
  students: FactDetailStudentRow[];
};

// ===== ROSTER TYPES (People page) =====

export type RosterLastAttempt = {
  assignmentId: number;
  score: number;
  total: number;
  percent: number; // 0–100
  completedAt: string; // ISO
  wasMastery: boolean;
};

export type RosterStudentRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  mustSetPassword: boolean;
  lastAttempt: RosterLastAttempt | null;
};

export type RosterClassroom = {
  id: number;
  name: string;
  timeZone?: string | null;
};

export type ProgressRosterDTO = {
  classroom: RosterClassroom;
  students: RosterStudentRow[];
  warning?: string;
};

export type BulkAddResponse = {
  setupCodes: SetupCodeRow[];
};

export type EditingState = {
  id: number;
  name: string;
  username: string;
  level: number;
};
