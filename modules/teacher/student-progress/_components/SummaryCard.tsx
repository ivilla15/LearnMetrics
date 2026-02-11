'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HelpText,
  Input,
  Label,
  StatPill,
} from '@/components';

import { formatLocal } from '@/lib/date';
import type { TeacherStudentProgressDTO } from '@/core/teacher/Progress';

export function SummaryCard(props: {
  classroomId: number;
  studentId: number;
  data: TeacherStudentProgressDTO;

  loading: boolean;
  daysText: string;
  onChangeDaysText: (next: string) => void;
  onApplyDays: () => void;

  printMode: boolean;
}) {
  const router = useRouter();
  const {
    classroomId,
    studentId,
    data,
    loading,
    daysText,
    onChangeDaysText,
    onApplyDays,
    printMode,
  } = props;

  const s = data.student;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Performance summary for the selected range.</CardDescription>
          </div>

          {!printMode ? (
            <div className="lm-no-print flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <Label htmlFor="days">Range (days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    inputMode="numeric"
                    value={daysText}
                    onChange={(e) => onChangeDaysText(e.target.value)}
                    className="w-27.5"
                  />
                  <Button variant="secondary" onClick={onApplyDays} disabled={loading}>
                    {loading ? 'Loading…' : 'Apply'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/teacher/classrooms/${classroomId}/progress`)}
                >
                  Back to class
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(
                      `/teacher/classrooms/${classroomId}/students/${studentId}/progress?print=1`,
                    )
                  }
                >
                  Print report
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Level" value={s.level ?? '—'} />
          <StatPill label="Attempts (range)" value={s.attemptsInRange ?? 0} />
          <StatPill
            label="Streak"
            tone="success"
            value={
              (s.masteryStreak ?? 0) > 0
                ? `${s.masteryStreak}`
                : (s.nonMasteryStreak ?? 0) > 0
                  ? `N${s.nonMasteryStreak}`
                  : '—'
            }
          />
          <StatPill label="Last attempt" value={formatLocal(s.lastAttemptAt ?? null)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Avg % (range)" value={`${s.avgPercentInRange ?? 0}%`} />
          <StatPill label="Mastery % (range)" value={`${s.masteryRateInRange ?? 0}%`} />
          <StatPill label="Last %" value={s.lastPercent === null ? '—' : `${s.lastPercent}%`} />
          <StatPill label="Median % (range)" value={`${s.medianPercentInRange ?? 0}%`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {s.flags?.needsSetup ? (
            <Badge tone="warning">Needs setup</Badge>
          ) : (
            <Badge tone="success">Active</Badge>
          )}
          {s.flags?.atRisk ? <Badge tone="danger">At-risk</Badge> : null}
          {s.flags?.stale14Days ? <Badge tone="warning">14+ days</Badge> : null}
          {s.flags?.nonMasteryStreak2 ? <Badge tone="warning">2+ not mastery</Badge> : null}
          {s.flags?.noAttemptsInRange ? <Badge tone="muted">No attempts</Badge> : null}
          {s.flags?.missedLastTest ? <Badge tone="warning">Missed last test</Badge> : null}
        </div>

        <HelpText>
          Range affects missed facts + range stats. Streaks and trend use a longer recent window.
        </HelpText>
      </CardContent>
    </Card>
  );
}
