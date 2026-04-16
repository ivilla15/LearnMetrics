'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
} from '@/components';
import { formatLocal } from '@/lib/date';

type LastTest = {
  assignmentId: number;
  opensAt: string | Date;
  mode: string;
  numQuestions: number;
  masteryRate: number;
  attemptedCount: number;
  avgPercent: number;
  missedCount?: number;
};

type Props = {
  days: number;
  masteryRateInRange: number;
  avgPercentInRange: number;
  activeStudents: number;
  totalStudents: number;
  atRiskCount: number;

  last3Tests: LastTest[];
  loading?: boolean;

  onOpenPicker: () => void;
  onOpenAssign: () => void;
  onFilterAtRisk: () => void;
  onScrollToStudents: () => void;
  onPrint: () => void;
};

export function ProgressSummaryCard({
  days,
  masteryRateInRange,
  avgPercentInRange,
  activeStudents,
  totalStudents,
  atRiskCount,
  last3Tests,
  loading,
  onOpenPicker,
  onOpenAssign,
  onFilterAtRisk,
  onScrollToStudents,
  onPrint,
}: Props) {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Class Progress</CardTitle>
            <CardDescription>Actionable insights for the last {days} days.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 lm-no-print">
            <Button variant="primary" onClick={onOpenPicker}>
              View student
            </Button>
            <Button variant="secondary" onClick={onOpenAssign}>
              Assign test
            </Button>
            <Button variant="secondary" onClick={onPrint}>
              Print / Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 4-stat summary strip */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">
              Class Mastery Rate
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <div className="mt-1 text-2xl font-bold text-[hsl(var(--fg))]">
                {masteryRateInRange}%
              </div>
            )}
          </div>

          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">
              Avg Score
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <div className="mt-1 text-2xl font-bold text-[hsl(var(--fg))]">
                {avgPercentInRange}%
              </div>
            )}
          </div>

          <div
            className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors"
            onClick={onScrollToStudents}
          >
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">
              Active Students
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <div className="mt-1 text-2xl font-bold text-[hsl(var(--fg))]">
                {activeStudents}
                <span className="text-base font-normal text-[hsl(var(--muted-fg))]">
                  /{totalStudents}
                </span>
              </div>
            )}
          </div>

          <div
            className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors"
            onClick={() => {
              onFilterAtRisk();
              onScrollToStudents();
            }}
          >
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">
              At-Risk Students
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <div
                className={[
                  'mt-1 text-2xl font-bold',
                  atRiskCount > 0 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--fg))]',
                ].join(' ')}
              >
                {atRiskCount}
              </div>
            )}
            <div className="mt-0.5 text-[11px] text-[hsl(var(--muted-fg))]">
              Click to filter table
            </div>
          </div>
        </div>

        {/* Last 3 tests — compact horizontal pills */}
        <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Recent Tests</div>

          {loading ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-52 rounded-[14px]" />
              ))}
            </div>
          ) : last3Tests.length === 0 ? (
            <div className="mt-3 text-sm text-[hsl(var(--muted-fg))]">
              No tests in this range yet.
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {last3Tests.map((t) => (
                <div
                  key={t.assignmentId}
                  className="flex flex-col gap-1 rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] px-4 py-3 min-w-[180px]"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">{t.mode}</Badge>
                    <span className="text-xs text-[hsl(var(--muted-fg))]">
                      {formatLocal(t.opensAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <span className="text-base font-semibold text-[hsl(var(--fg))]">
                        {t.masteryRate}%
                      </span>
                      <span className="text-[11px] text-[hsl(var(--muted-fg))] ml-1">mastery</span>
                    </div>
                    <div>
                      <span className="text-base font-semibold text-[hsl(var(--fg))]">
                        {t.attemptedCount}
                      </span>
                      <span className="text-[11px] text-[hsl(var(--muted-fg))] ml-1">
                        attempted
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
