'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components';

type IntegrityStats = {
  withEvents: number;
  flagged: number;
  invalidated: number;
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'danger' | 'warning' | 'success' | 'neutral';
}) {
  const colorMap = {
    danger: 'text-[hsl(var(--danger))]',
    warning: 'text-amber-600',
    success: 'text-[hsl(var(--success))]',
    neutral: 'text-[hsl(var(--muted-fg))]',
  };
  return (
    <div className="flex flex-col items-center">
      <span className={['text-xl font-bold', colorMap[tone]].join(' ')}>{value}</span>
      <span className="text-[10px] font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function IntegrityCard({ stats, classroomId }: { stats: IntegrityStats; classroomId: number }) {
  const hasAny = stats.invalidated > 0 || stats.flagged > 0 || stats.withEvents > 0;
  const tone: 'danger' | 'warning' | 'success' =
    stats.invalidated > 0
      ? 'danger'
      : stats.flagged > 0 || stats.withEvents > 0
        ? 'warning'
        : 'success';

  const bgMap = {
    danger: 'border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.04)]',
    warning: 'border-amber-200 bg-amber-50/60',
    success: 'border-[hsl(var(--border))] bg-[hsl(var(--surface))]',
  };

  return (
    <div className={bgMap[tone]}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Integrity</h2>
        {hasAny ? (
          <Link
            href={`/teacher/classrooms/${classroomId}/assignments`}
            className="text-[11px] font-medium text-[hsl(var(--brand))] hover:underline shrink-0"
          >
            Review →
          </Link>
        ) : null}
      </div>

      {!hasAny ? (
        <Card>
          <CardHeader className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-[hsl(var(--success))]">✓</span>
            <span className="text-sm text-[hsl(var(--success))] font-medium">Clean</span>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex items-center gap-4">
          <Stat
            label="Events"
            value={stats.withEvents}
            tone={
              stats.withEvents > 0 && stats.flagged === 0 && stats.invalidated === 0
                ? 'warning'
                : 'neutral'
            }
          />
          <Stat
            label="Flagged"
            value={stats.flagged}
            tone={stats.flagged > 0 ? 'warning' : 'neutral'}
          />
          <Stat
            label="Invalidated"
            value={stats.invalidated}
            tone={stats.invalidated > 0 ? 'danger' : 'neutral'}
          />
        </div>
      )}
    </div>
  );
}

export function ClassroomIntegritySummary({ classroomId }: { classroomId: number }) {
  const [stats, setStats] = React.useState<IntegrityStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/teacher/classrooms/${classroomId}/integrity-summary`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((j: unknown) => {
        if (cancelled) return;
        const d = j as IntegrityStats;
        setStats(d);
      })
      .catch(() => {
        if (!cancelled) setStats({ withEvents: 0, flagged: 0, invalidated: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  if (!stats) {
    // Skeleton
    return (
      <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 animate-pulse">
        <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Needs Attention</h2>
        <div className="flex gap-4">
          <div className="h-8 w-10 rounded bg-[hsl(var(--surface-2))]" />
          <div className="h-8 w-10 rounded bg-[hsl(var(--surface-2))]" />
          <div className="h-8 w-10 rounded bg-[hsl(var(--surface-2))]" />
        </div>
      </div>
    );
  }

  return <IntegrityCard stats={stats} classroomId={classroomId} />;
}
