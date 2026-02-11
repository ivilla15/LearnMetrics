'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HelpText,
  Pill,
  Button,
} from '@/components';
import { formatLocal } from '@/lib/date';
import type { TeacherAssignmentAttemptsResponse } from '@/types';

type AssignmentSummary = TeacherAssignmentAttemptsResponse['assignment'];

export function AssignmentSummaryCard(props: {
  assignment: AssignmentSummary | null;
  counts: {
    totalStudents: number;
    attemptedCount: number;
    masteryCount: number;
    missingCount: number;
  };
  onAssign: () => void;
}) {
  const { assignment, counts, onAssign } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Assignment summary</CardTitle>
            <CardDescription>Overview for this specific assignment.</CardDescription>
          </div>

          <Button variant="primary" onClick={onAssign}>
            Assign test
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Pill(assignment?.mode ?? '—', 'muted')}
          {Pill(assignment?.kind ?? '—', 'muted')}
          {Pill(`${assignment?.numQuestions ?? 12} Q`, 'muted')}
        </div>

        <div className="text-sm text-[hsl(var(--muted-fg))]">
          Opens:{' '}
          <span className="text-[hsl(var(--fg))] font-medium">
            {formatLocal(assignment?.opensAt ?? null)}
          </span>
          {' · '}
          Closes:{' '}
          <span className="text-[hsl(var(--fg))] font-medium">
            {formatLocal(assignment?.closesAt ?? null)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {Pill(`Attempted: ${counts.attemptedCount}/${counts.totalStudents}`, 'muted')}
          {Pill(`Mastered: ${counts.masteryCount}`, 'success')}
          {Pill(`Missing: ${counts.missingCount}`, 'warning')}
        </div>

        <HelpText>Click a student row to open their attempt details.</HelpText>
      </CardContent>
    </Card>
  );
}
