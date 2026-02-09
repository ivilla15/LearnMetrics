'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import type { AssignmentAttemptsFilter, AttemptResultsRow } from '@/types';
import { AttemptResultsTable } from '@/modules/teacher/student-progress';

export function AssignmentResultsCard(props: {
  loading: boolean;

  filter: AssignmentAttemptsFilter;
  onChangeFilter: (next: AssignmentAttemptsFilter) => void;

  rows: AttemptResultsRow[];
  onViewDetails: (row: AttemptResultsRow) => void;
}) {
  const { loading, filter, onChangeFilter, rows, onViewDetails } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Student results</CardTitle>
        <CardDescription>
          Score, percent, missed, mastery, and level-at-time for every student.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AttemptResultsTable
          rows={rows}
          loading={loading}
          showStudentColumn={true}
          searchEnabled={true}
          filterOptions={[
            { key: 'ALL', label: 'All' },
            { key: 'MASTERY', label: 'Mastery' },
            { key: 'NOT_MASTERY', label: 'Not mastery' },
            { key: 'MISSING', label: 'Missing' },
          ]}
          filter={filter}
          onChangeFilter={(key) => onChangeFilter(key as AssignmentAttemptsFilter)}
          onViewDetails={onViewDetails}
          helpText={<>Missing means there is no attempt record for this assignment.</>}
        />
      </CardContent>
    </Card>
  );
}
