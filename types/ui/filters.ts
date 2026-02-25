import type { AssignmentMode, AssignmentType } from '@/types/enums';

export type AssignmentStatusFilter = 'all' | 'open' | 'finished' | 'upcoming';

export type AssignmentModeFilter = 'all' | AssignmentMode;
export type AssignmentTypeFilter = 'all' | AssignmentType;

export type AssignmentAttemptsFilter = 'ALL' | 'MASTERY' | 'NOT_MASTERY' | 'MISSING';
export const ATTEMPT_EXPLORER_FILTERS = ['ALL', 'MASTERY', 'NOT_MASTERY'] as const;
export type AttemptExplorerFilter = (typeof ATTEMPT_EXPLORER_FILTERS)[number];

export type MinutesOption = 'OFF' | '2' | '4' | '6' | '8';

export const CLASSROOM_PROGRESS_FILTER_KEYS = [
  'all',
  'atRisk',
  'stale14',
  'missedLastTest',
  'streak2',
  'masteryStreak2',
  'needsSetup',
  'improving',
  'regressing',
] as const;

export type FilterKey = (typeof CLASSROOM_PROGRESS_FILTER_KEYS)[number];
