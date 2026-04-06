'use client';

import * as React from 'react';
import { Skeleton } from '@/components';
import { proficiencyTier } from '@/core/progress/utils';
import type { ClassroomProgressDTO, TeacherClassroomOverviewStatsDTO } from '@/types';
import { formatDistanceToNowStrict, parseISO, differenceInHours } from 'date-fns';

type Props = {
  overview: TeacherClassroomOverviewStatsDTO;
  summary: ClassroomProgressDTO['summary'];
  activeThisWeek: number;
  nextTestOpensAt: string | null;
  onScrollToAtRisk?: () => void;
};

const TIER_COLORS: Record<ReturnType<typeof proficiencyTier>, string> = {
  beginning: 'text-[hsl(var(--danger))]',
  developing: 'text-[hsl(var(--warning))]',
  proficient: 'text-[hsl(var(--success))]',
  advanced: 'text-[hsl(var(--brand))]',
};

function avgScoreColor(avg: number): string {
  if (avg < 70) return 'text-[hsl(var(--danger))]';
  if (avg < 85) return 'text-[hsl(var(--warning))]';
  return 'text-[hsl(var(--success))]';
}

function formatNextTest(opensAt: string | null): {
  label: string;
  urgent: boolean;
} {
  if (!opensAt) return { label: '—', urgent: false };
  const opens = parseISO(opensAt);
  const hoursUntil = differenceInHours(opens, new Date());
  const urgent = hoursUntil >= 0 && hoursUntil < 24;
  const label =
    hoursUntil < 0 ? 'In progress' : formatDistanceToNowStrict(opens, { addSuffix: true });
  return { label, urgent };
}

function StatCard({
  label,
  children,
  onClick,
  clickHint,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  clickHint?: string;
}) {
  return (
    <div
      className={[
        'rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4',
        onClick ? 'cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors' : '',
      ].join(' ')}
      onClick={onClick}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
        {label}
      </div>
      <div className="mt-1">{children}</div>
      {clickHint ? (
        <div className="mt-0.5 text-[11px] text-[hsl(var(--muted-fg))]">{clickHint}</div>
      ) : null}
    </div>
  );
}

export function ClassHealthStrip({
  summary,
  activeThisWeek,
  nextTestOpensAt,
  onScrollToAtRisk,
}: Props) {
  const tier = proficiencyTier(summary.masteryRateInRange);
  const { label: nextTestLabel, urgent: nextTestUrgent } = formatNextTest(nextTestOpensAt);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {/* Class Mastery Rate */}
      <StatCard label="Class Mastery Rate">
        <div className="flex items-baseline gap-2">
          <span className={['text-2xl font-bold', TIER_COLORS[tier]].join(' ')}>
            {summary.masteryRateInRange}%
          </span>
          <span className="text-xs text-[hsl(var(--muted-fg))]">{tier}</span>
        </div>
      </StatCard>

      {/* Avg Score */}
      <StatCard label="Avg Score">
        <span
          className={['text-2xl font-bold', avgScoreColor(summary.avgPercentInRange)].join(' ')}
        >
          {summary.avgPercentInRange}%
        </span>
      </StatCard>

      {/* Active This Week */}
      <StatCard label="Active This Week">
        <div className="text-2xl font-bold text-[hsl(var(--fg))]">
          {activeThisWeek}
          <span className="text-base font-normal text-[hsl(var(--muted-fg))]">
            /{summary.studentsTotal}
          </span>
        </div>
        <div className="text-[11px] text-[hsl(var(--muted-fg))]">students</div>
      </StatCard>

      {/* At Risk */}
      <StatCard
        label="At Risk"
        onClick={summary.atRiskCount > 0 ? onScrollToAtRisk : undefined}
        clickHint={summary.atRiskCount > 0 ? 'Scroll to Needs Attention' : undefined}
      >
        <span
          className={[
            'text-2xl font-bold',
            summary.atRiskCount > 0 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--fg))]',
          ].join(' ')}
        >
          {summary.atRiskCount}
        </span>
      </StatCard>

      {/* Next Test */}
      <StatCard label="Next Test">
        <span
          className={[
            'text-2xl font-bold',
            nextTestUrgent ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--fg))]',
          ].join(' ')}
        >
          {nextTestLabel}
        </span>
      </StatCard>
    </div>
  );
}

export function ClassHealthStripSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {['Class Mastery Rate', 'Avg Score', 'Active This Week', 'At Risk', 'Next Test'].map(
        (label) => (
          <div
            key={label}
            className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
              {label}
            </div>
            <Skeleton className="mt-2 h-8 w-20" />
          </div>
        ),
      )}
    </div>
  );
}
