import type { AssignmentMode, AssignmentType } from '@/types/enums';

export type AssignmentStatusFilter = 'all' | 'open' | 'finished' | 'upcoming';

export type AssignmentModeFilter = 'all' | AssignmentMode;
export type AssignmentTypeFilter = 'all' | AssignmentType;

export type AttemptExplorerFilter = 'ALL' | 'MASTERY' | 'NOT_MASTERY';
export type AssignmentAttemptsFilter = 'ALL' | 'MASTERY' | 'NOT_MASTERY' | 'MISSING';
