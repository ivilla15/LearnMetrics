'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import { AttemptResultsTable } from '@/modules/teacher/student-progress';
import type { AssignmentAttemptsFilter, AttemptResultsRowDTO, AssignmentTargetKind } from '@/types';
import { ASSIGNMENT_ATTEMPTS_FILTER_OPTIONS } from '@/types';

export function AssignmentResultsCard(props: {
  loading: boolean;

  targetKind: AssignmentTargetKind | null;

  filter: AssignmentAttemptsFilter;
  onChangeFilter: (next: AssignmentAttemptsFilter) => void;

  rows: AttemptResultsRowDTO[];
  onViewDetails: (row: AttemptResultsRowDTO) => void;
}) {
  const { loading, targetKind, filter, onChangeFilter, rows, onViewDetails } = props;

  const isPracticeTime = targetKind === 'PRACTICE_TIME';

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Student results</CardTitle>
        <CardDescription>
          {isPracticeTime
            ? 'Practice-time assignments track minutes across sessions, not per-question attempts.'
            : 'Score, percent, missed, mastery, and level-at-time for every student.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPracticeTime ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">
            This assignment is practice-time based. Students complete multiple practice sessions
            during the assignment window and their time accumulates toward the requirement.
          </div>
        ) : (
          <AttemptResultsTable
            rows={rows}
            loading={loading}
            showStudentColumn={true}
            searchEnabled={true}
            filterOptions={ASSIGNMENT_ATTEMPTS_FILTER_OPTIONS}
            filter={filter}
            onChangeFilter={onChangeFilter}
            onViewDetails={onViewDetails}
            helpText={<>Missing means there is no attempt record for this assignment.</>}
          />
        )}
      </CardContent>
    </Card>
  );
}
