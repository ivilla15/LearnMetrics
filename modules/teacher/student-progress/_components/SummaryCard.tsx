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
  Skeleton,
} from '@/components';

import type { TeacherStudentProgressDTO } from '@/types';
import { proficiencyTier } from '@/core/progress/utils';
import { getDomainLabel } from '@/core/domain';
import type { DomainCode } from '@/types/domain';

// ── Proficiency tier config ────────────────────────────────────────────────────

const TIER_CONFIG = {
  beginning: {
    label: 'Beginning',
    bg: 'bg-[hsl(var(--danger)/0.1)]',
    text: 'text-[hsl(var(--danger))]',
    border: 'border-[hsl(var(--danger)/0.3)]',
  },
  developing: {
    label: 'Developing',
    bg: 'bg-[hsl(var(--warning)/0.1)]',
    text: 'text-[hsl(var(--warning))]',
    border: 'border-[hsl(var(--warning)/0.3)]',
  },
  proficient: {
    label: 'Proficient',
    bg: 'bg-[hsl(var(--success)/0.1)]',
    text: 'text-[hsl(var(--success))]',
    border: 'border-[hsl(var(--success)/0.3)]',
  },
  advanced: {
    label: 'Advanced',
    bg: 'bg-[hsl(var(--brand)/0.1)]',
    text: 'text-[hsl(var(--brand))]',
    border: 'border-[hsl(var(--brand)/0.3)]',
  },
} as const;

const OP_LABEL: Record<string, string> = {
  ADD: 'Addition',
  SUB: 'Subtraction',
  MUL: 'Multiplication',
  DIV: 'Division',
};

// ── Last Active helper ─────────────────────────────────────────────────────────

function formatLastActive(days: number | null): { text: string; stale: boolean } {
  if (days === null) return { text: '—', stale: false };
  if (days === 0) return { text: 'Today', stale: false };
  if (days === 1) return { text: 'Yesterday', stale: false };
  return { text: `${days} days ago`, stale: days >= 14 };
}

// ── Standing comparison ────────────────────────────────────────────────────────

function StandingBadge({ studentAvg, classAvg }: { studentAvg: number; classAvg: number }) {
  const diff = studentAvg - classAvg;
  if (Math.abs(diff) <= 2) {
    return (
      <span className="text-xs text-[hsl(var(--muted-fg))]">→ At class average ({classAvg}%)</span>
    );
  }
  if (diff > 0) {
    return (
      <span className="text-xs text-[hsl(var(--success))]">
        ↑ Above class average (+{Math.round(diff)}% vs {classAvg}%)
      </span>
    );
  }
  return (
    <span className="text-xs text-[hsl(var(--danger))]">
      ↓ Below class average ({Math.round(diff)}% vs {classAvg}%)
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SummaryCard(props: {
  classroomId: number;
  studentId: number;
  data: TeacherStudentProgressDTO;

  loading: boolean;
  daysText: string;
  onChangeDaysText: (next: string) => void;
  onApplyDays: () => void;

  printMode: boolean;

  /** Optional — if provided, shows above/at/below class average */
  classroomAvgPercent?: number | null;
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
    classroomAvgPercent,
  } = props;

  const s = data.student;
  const practiceSummary = data.practice?.summary ?? null;

  const tier = proficiencyTier(s.masteryRateInRange ?? 0);
  const tierCfg = TIER_CONFIG[tier];
  const lastActive = formatLastActive(s.daysSinceLastAttempt);

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

      <CardContent className="space-y-5">
        {/* Zone 1 — Current Proficiency */}
        <div className={['rounded-[18px] border p-5', tierCfg.bg, tierCfg.border].join(' ')}>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-48" />
            </div>
          ) : (
            <>
              <div className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Proficiency
              </div>
              <div className={['mt-2 text-3xl font-bold', tierCfg.text].join(' ')}>
                {tierCfg.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={['text-4xl font-black', tierCfg.text].join(' ')}>
                  {s.masteryRateInRange ?? 0}%
                </span>
                <span className="text-sm text-[hsl(var(--muted-fg))]">mastery rate</span>
              </div>

              {/* Zone 3 — Standing Comparison */}
              {classroomAvgPercent != null ? (
                <div className="mt-3">
                  <StandingBadge
                    studentAvg={s.avgPercentInRange ?? 0}
                    classAvg={classroomAvgPercent}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Zone 2 — Growth Snapshot */}
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {/* Level */}
          <div className="rounded-[14px] bg-[hsl(var(--surface))] px-4 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Current Stats</div>

            {loading ? (
              <Skeleton className="mt-2 h-10 w-28" />
            ) : (
              <div className="mt-2 space-y-0.5 text-[hsl(var(--fg))]">
                <div className="text-lg font-semibold">Level {s.activeLevel ?? s.level ?? '—'}</div>

                {(s.activeDomain || s.activeOperation) && (
                  <div className="text-sm">
                    {s.activeDomain
                      ? getDomainLabel(s.activeDomain as DomainCode)
                      : (OP_LABEL[s.activeOperation] ?? s.activeOperation)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attempts */}
          <div className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-4 py-3">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Attempts</div>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              <div className="mt-1 text-xl font-bold text-[hsl(var(--fg))]">
                {s.attemptsInRange ?? 0}
              </div>
            )}
          </div>

          {/* Avg Score */}
          <div className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-4 py-3">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Avg Score</div>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-14" />
            ) : (
              <div className="mt-1 text-xl font-bold text-[hsl(var(--fg))]">
                {s.avgPercentInRange ?? 0}%
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-4 py-3">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Streak</div>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-16" />
            ) : (
              <div className="mt-1 text-xl font-bold">
                {(s.masteryStreak ?? 0) > 0 ? (
                  <span className="text-[hsl(var(--success))]">🔥 {s.masteryStreak}</span>
                ) : (s.nonMasteryStreak ?? 0) > 0 ? (
                  <span className="text-[hsl(var(--warning))]">⚠ {s.nonMasteryStreak}</span>
                ) : (
                  <span className="text-[hsl(var(--muted-fg))]">—</span>
                )}
              </div>
            )}
          </div>

          {/* Last Active */}
          <div className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-4 py-3">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Last Active</div>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-24" />
            ) : (
              <div
                className={[
                  'mt-1 text-base font-semibold',
                  lastActive.stale ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--fg))]',
                ].join(' ')}
              >
                {lastActive.text}
              </div>
            )}
          </div>
        </div>

        {practiceSummary ? (
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Practice</div>
            <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
              {practiceSummary.completedSets ?? 0} / {practiceSummary.requiredSets ?? 0} qualifying
              sets ({practiceSummary.percent ?? 0}%)
            </div>
          </div>
        ) : null}

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
