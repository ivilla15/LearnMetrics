import type { OperationCode, AssignmentMode } from '@/types/enums';
import { PracticeProgressDTO } from './student';

export type TrendLast3 = 'improving' | 'regressing' | 'flat' | 'need3';

export type ClassroomProgressStudentRowDTO = {
  id: number;
  name: string;
  username: string;
  level: number;

  mustSetPassword: boolean;

  attemptsInRange: number;
  masteryRateInRange: number;
  avgPercentInRange: number;
  medianPercentInRange: number;

  lastAttemptAt: string | null;
  lastPercent: number | null;

  masteryStreak: number;
  nonMasteryStreak: number;
  trendLast3: TrendLast3;
  daysSinceLastAttempt: number | null;

  flags: {
    atRisk: boolean;
    noAttemptsInRange: boolean;
    stale14Days: boolean;
    nonMasteryStreak2: boolean;
    needsSetup: boolean;

    missedLastTest: boolean;
    lastTestAttempted: boolean;
    lastTestMastery: boolean;
  };
};

export type ClassroomProgressLastTestDTO = {
  assignmentId: number;
  opensAt: string;
  mode: AssignmentMode;
  numQuestions: number;
  attemptedCount: number;
  masteryRate: number;
  avgPercent: number;
  missedCount: number;
};

export type MissedFactDTO = {
  operation: OperationCode;
  operandA: number;
  operandB: number;
  correctAnswer: number;
  incorrectCount: number;
  totalCount: number;
  errorRate: number;
};

export type FactDetailDTO = {
  operation: OperationCode;
  operandA: number;
  operandB: number;
  correctAnswer: number;
  totalIncorrect: number;
  totalAttempts: number;
  students: Array<{
    studentId: number;
    name: string;
    username: string;
    incorrectCount: number;
    totalCount: number;
  }>;
};

export type ClassroomProgressDTO = {
  classroom: { id: number; name: string };
  range: { startAt: string; endAt: string; days: number };

  recent: { last3Tests: ClassroomProgressLastTestDTO[] };

  summary: {
    studentsTotal: number;

    attemptsInRange: number;
    masteryRateInRange: number;
    avgPercentInRange: number;

    highestLevel: number | null;
    lowestRecentPercent: number | null;

    atRiskCount: number;
    noAttemptsCount: number;
    stale14DaysCount: number;
    nonMasteryStreak2Count: number;

    missedLastTestCount: number;
  };

  charts: {
    daily: Array<{ date: string; attempts: number; masteryRate: number; avgPercent: number }>;
    scoreBuckets: Array<{ label: string; count: number }>;
    levelBuckets: Array<{ level: number; count: number }>;
  };

  insights: { topMissedFacts: MissedFactDTO[] };

  students: ClassroomProgressStudentRowDTO[];
};

export type TeacherStudentProgressDTO = {
  classroom: { id: number; name: string };
  range: { startAt: string; endAt: string; days: number };

  student: {
    id: number;
    name: string;
    username: string;
    level: number;
    mustSetPassword: boolean;

    attemptsInRange: number;
    masteryRateInRange: number;
    avgPercentInRange: number;
    medianPercentInRange: number;
    lastAttemptAt: string | null;
    lastPercent: number | null;

    masteryStreak: number;
    nonMasteryStreak: number;
    trendLast3: 'improving' | 'regressing' | 'flat' | 'need3';
    daysSinceLastAttempt: number | null;

    flags: {
      atRisk: boolean;
      noAttemptsInRange: boolean;
      stale14Days: boolean;
      nonMasteryStreak2: boolean;
      needsSetup: boolean;
      missedLastTest: boolean;
      lastTestAttempted: boolean;
      lastTestMastery: boolean;
    };
  };

  practice?: {
    summary: {
      requiredSeconds: number;
      completedSeconds: number;
      percent: number;
    } | null;
    rows: PracticeProgressDTO[];
  } | null;

  insights: { topMissedFacts: MissedFactDTO[] };
  recent: {
    attempts: Array<{
      id: number;
      completedAt: string;
      score: number;
      total: number;
      percent: number;
      mastered: boolean;
      missedCount: number;
    }>;
  };
};
