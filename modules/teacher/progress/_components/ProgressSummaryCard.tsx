'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  HelpText,
  StatPill,
  Badge,
} from '@/components';
import { formatLocal } from '@/lib/date';

type Props = {
  days: number;
  participationText: string;
  missedLastTestCount: number | null;
  masteryStreak2Count: number;

  atRiskCount: number;
  nonMasteryStreak2Count: number;
  lowestRecentPercent: number | null;
  masteryRateInRange: number;
  avgPercentInRange: number;
  highestLevel: number | string;
  attemptsInRange: number;
  studentsTotal: number;

  last3Tests: Array<{
    assignmentId: number;
    opensAt: string | Date;
    mode: string;
    numQuestions: number;
    masteryRate: number;
    attemptedCount: number;
    avgPercent: number;
    missedCount?: number;
  }>;

  onOpenPicker: () => void;
  onOpenAssign: () => void;

  onFilterAtRisk: () => void;
  onFilterMissedLastTest: () => void;
  onFilterMasteryStreak2: () => void;
  onFilterNonMasteryStreak2: () => void;
  onClearFilters: () => void;
  onScrollToStudents: () => void;

  onGoStudent: (studentId: number) => void;
};

export function ProgressSummaryCard(props: Props) {
  const {
    days,
    participationText,
    missedLastTestCount,
    masteryStreak2Count,
    atRiskCount,
    nonMasteryStreak2Count,
    lowestRecentPercent,
    masteryRateInRange,
    avgPercentInRange,
    highestLevel,
    attemptsInRange,
    studentsTotal,
    last3Tests,
    onOpenPicker,
    onOpenAssign,
    onFilterAtRisk,
    onFilterMissedLastTest,
    onFilterMasteryStreak2,
    onFilterNonMasteryStreak2,
    onClearFilters,
    onScrollToStudents,
  } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Class Progress</CardTitle>
            <CardDescription>Actionable insights for the last {days} days.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={onOpenPicker}>
              View student
            </Button>
            <Button variant="secondary" onClick={onOpenAssign}>
              Assign test
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill
            label="At-risk students"
            value={atRiskCount}
            tone="danger"
            onClick={() => {
              onFilterAtRisk();
              onScrollToStudents();
            }}
          />

          <StatPill
            label="Missed last test"
            value={missedLastTestCount ?? 0}
            tone="warning"
            onClick={() => {
              onFilterMissedLastTest();
              onScrollToStudents();
            }}
          />

          <StatPill
            label="2+ Mastery streak"
            value={masteryStreak2Count}
            tone="success"
            onClick={() => {
              onFilterMasteryStreak2();
              onScrollToStudents();
            }}
          />

          <StatPill
            label="2+ non-mastery streak"
            value={nonMasteryStreak2Count}
            tone="warning"
            onClick={() => {
              onFilterNonMasteryStreak2();
              onScrollToStudents();
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill
            label="Participation (range)"
            value={participationText}
            onClick={() => {
              onClearFilters();
              onScrollToStudents();
            }}
          />

          <StatPill
            label="Lowest recent %"
            value={lowestRecentPercent == null ? '—' : `${lowestRecentPercent}%`}
          />

          <StatPill label="Mastery rate (range)" value={`${masteryRateInRange}%`} />
          <StatPill label="Average score (range)" value={`${avgPercentInRange}%`} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Highest level" value={highestLevel ?? '—'} />
          <StatPill label="Division Students" value="0" />
          <StatPill label="Attempts (range)" value={attemptsInRange} />
          <StatPill label="Students total" value={studentsTotal} />
        </div>

        <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[hsl(var(--fg))]">Today’s Focus</div>
              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                Prioritized students who need attention right now.
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={onFilterAtRisk}>
              Filter at-risk
            </Button>
          </div>
        </div>

        <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Last 3 tests</div>
          <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
            Quick snapshot of recent performance.
          </div>

          {last3Tests.length === 0 ? (
            <div className="mt-3 text-sm text-[hsl(var(--muted-fg))]">
              No tests in this range yet.
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {last3Tests.map((t) => (
                <div
                  key={t.assignmentId}
                  className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                    {formatLocal(t.opensAt)}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {Badge({ text: `${t.mode}`, tone: 'muted' })}
                    {Badge({ text: `${t.mode} Q`, tone: 'muted' })}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px] text-[hsl(var(--muted-fg))]">Mastery</div>
                      <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                        {t.masteryRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[hsl(var(--muted-fg))]">Attempted</div>
                      <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                        {t.attemptedCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[hsl(var(--muted-fg))]">Avg</div>
                      <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                        {t.avgPercent}%
                      </div>
                    </div>
                  </div>

                  {t.missedCount !== undefined ? (
                    <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
                      Missed: {t.missedCount}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <HelpText>
          “At-risk” includes: no attempts in range, 14+ days since last attempt, 2+ non-mastery
          streak, or median score &lt; 70% in range.
        </HelpText>
      </CardContent>
    </Card>
  );
}
