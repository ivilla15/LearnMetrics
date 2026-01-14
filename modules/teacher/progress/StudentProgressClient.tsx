'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  MiniBar,
  StatPill,
} from '@/components';

import { AttemptExplorer } from '@/modules';
import { formatLocal } from '@/lib/date';
import { MissedFact, TeacherStudentProgressDTO } from '@/core/teacher/Progress';

type Props = {
  classroomId: number;
  studentId: number;
  initial: TeacherStudentProgressDTO;
};

export function StudentProgressClient({ classroomId, studentId, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printMode = searchParams.get('print') === '1';

  const [data, setData] = React.useState<TeacherStudentProgressDTO>(initial);
  const [loading, setLoading] = React.useState(false);

  const [daysText, setDaysText] = React.useState(String(initial.range.days ?? 30));

  React.useEffect(() => {
    if (data.range.days) setDaysText(String(data.range.days));
  }, [data.range.days]);

  async function reload(nextDays: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/students/${studentId}/progress?days=${nextDays}`,
        { cache: 'no-store' },
      );

      const json: TeacherStudentProgressDTO | null = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof (json as { error?: string } | null)?.error === 'string'
            ? (json as { error?: string }).error
            : 'Failed to load';
        throw new Error(msg);
      }

      if (json) setData(json);
    } finally {
      setLoading(false);
    }
  }

  function applyDays() {
    const parsed = Number(daysText);
    const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    void reload(safe);
  }

  // optional: auto print when opening ?print=1
  React.useEffect(() => {
    if (!printMode) return;
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, [printMode]);

  const s = data.student;

  const missedFacts: MissedFact[] = Array.isArray(data.insights?.topMissedFacts)
    ? data.insights.topMissedFacts
    : [];

  const maxIncorrect = missedFacts.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Print header */}
      <div className="lm-print-only rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
        <div className="text-sm font-semibold text-[hsl(var(--fg))]">Student Progress Report</div>
        <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
          {s.name} • @{s.username} • {data.classroom.name} • Range: last {data.range.days} days •
          Generated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Summary */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Performance summary for the selected range.</CardDescription>
            </div>

            <div className="lm-no-print flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <Label htmlFor="days">Range (days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    inputMode="numeric"
                    value={daysText}
                    onChange={(e) => setDaysText(e.target.value)}
                    className="w-[110px]"
                  />
                  <Button variant="secondary" onClick={applyDays} disabled={loading}>
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
            {s.flags?.needsSetup ? Badge('Needs setup', 'warning') : Badge('Active', 'success')}
            {s.flags?.atRisk ? Badge('At-risk', 'danger') : null}
            {s.flags?.stale14Days ? Badge('14+ days', 'warning') : null}
            {s.flags?.nonMasteryStreak2 ? Badge('2+ not mastery', 'warning') : null}
            {s.flags?.noAttemptsInRange ? Badge('No attempts', 'muted') : null}
            {s.flags?.missedLastTest ? Badge('Missed last test', 'warning') : null}
          </div>

          <HelpText>
            Range affects missed facts + range stats. Streaks and trend use a longer recent window.
          </HelpText>
        </CardContent>
      </Card>

      {/* Missed Facts */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Most Missed Facts</CardTitle>
          <CardDescription>
            Facts this student missed most within the selected range.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {missedFacts.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">
              No missed facts in this range.
            </div>
          ) : (
            missedFacts.map((m) => (
              <div
                key={m.questionId}
                className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                      {m.factorA} × {m.factorB} = {m.answer}
                    </div>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                      Incorrect {m.incorrectCount}/{m.totalCount} ({m.errorRate}% error)
                    </div>
                  </div>

                  <div className="w-[180px]">
                    <MiniBar value={m.incorrectCount} max={maxIncorrect} />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AttemptExplorer
        baseUrl={`/api/teacher/classrooms/${classroomId}/students/${studentId}`}
        studentId={studentId}
        studentName={s?.name}
        studentUsername={s?.username}
        hideControls={printMode}
      />
    </div>
  );
}
