'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { formatLocal } from '@/lib';
import { formatAssignmentMode, formatAssignmentType, formatOperation } from '@/types/display';
import type { StudentAssignmentListItemDTO } from '@/types';
import { Card, CardHeader, Pill } from '@/components';

type Props = {
  rows: StudentAssignmentListItemDTO[];
};

type DayHeader = {
  title: string;
  subtitle: string | null;
};

type DayGroup = {
  key: string;
  header: DayHeader;
  rows: StudentAssignmentListItemDTO[];
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatWindowLine(params: { opensAt: string; closesAt: string | null }) {
  const now = Date.now();
  const closesMs = params.closesAt ? new Date(params.closesAt).getTime() : null;

  if (closesMs !== null && Number.isFinite(closesMs) && closesMs < now) {
    return `Closed at: ${formatLocal(params.closesAt!)}`;
  }

  if (params.closesAt) {
    return `Opens: ${formatLocal(params.opensAt)} · Closes: ${formatLocal(params.closesAt)}`;
  }

  return `Opens: ${formatLocal(params.opensAt)}`;
}

function addDays(base: Date, deltaDays: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatMonthDay(day: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(day);
}

function formatShortMonthDay(day: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(day);
}

function dayHeader(day: Date, now: Date): DayHeader {
  const a = startOfDay(day).getTime();
  const b = startOfDay(now).getTime();
  const diffDays = Math.round((a - b) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return { title: 'Today', subtitle: formatMonthDay(day) };
  }

  if (diffDays === 1) {
    return { title: `Tomorrow, ${formatMonthDay(day)}`, subtitle: null };
  }

  if (diffDays === -1) {
    return { title: `Yesterday, ${formatMonthDay(day)}`, subtitle: null };
  }

  return { title: formatShortMonthDay(day), subtitle: null };
}

function getRowDate(row: StudentAssignmentListItemDTO) {
  // Prefer scheduled runDate for day grouping when available (YYYY-MM-DD).
  if (row.runDate) {
    // Interpret as local date (no timezone shifting).
    const [y, m, d] = row.runDate.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }

  // Otherwise group by opensAt
  return new Date(row.opensAt);
}

function groupByDay(rows: StudentAssignmentListItemDTO[]): DayGroup[] {
  const now = new Date();
  const map = new Map<string, DayGroup>();

  // Seed required buckets (but they still sort naturally with the rest)
  for (const d of [addDays(now, -1), now, addDays(now, 1)]) {
    const key = toDayKey(d);
    map.set(key, { key, header: dayHeader(d, now), rows: [] });
  }

  for (const row of rows) {
    const d = getRowDate(row);
    const key = toDayKey(d);

    const existing = map.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      map.set(key, { key, header: dayHeader(d, now), rows: [row] });
    }
  }

  const groups = Array.from(map.values()).sort((a, b) => (a.key < b.key ? -1 : 1));

  // Within each day, show OPEN/UPCOMING before FINISHED, then by opensAt desc
  for (const g of groups) {
    g.rows.sort((r1, r2) => {
      const rank = (s: StudentAssignmentListItemDTO['status']) =>
        s === 'OPEN' ? 0 : s === 'UPCOMING' ? 1 : 2;

      const rr = rank(r1.status) - rank(r2.status);
      if (rr !== 0) return rr;

      const t1 = new Date(r1.opensAt).getTime();
      const t2 = new Date(r2.opensAt).getTime();
      return t2 - t1;
    });
  }

  return groups;
}

export function AssignmentsTimeline({ rows }: Props) {
  const router = useRouter();
  const groups = React.useMemo(() => groupByDay(rows), [rows]);
  const didScrollRef = React.useRef(false);
  const todayAnchorRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (didScrollRef.current) return;
    if (!todayAnchorRef.current) return;

    didScrollRef.current = true;

    todayAnchorRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [groups]);

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const isToday = g.header.title === 'Today';

        return (
          <div key={g.key} className="space-y-3">
            <div ref={isToday ? todayAnchorRef : null} />

            {/* Date header OUTSIDE cards */}
            <div className="px-1">
              <div className="text-sm font-bold uppercase tracking-wider text-black">
                {g.header.title}
              </div>
              {g.header.subtitle ? (
                <div className="mt-1 text-sm font-medium text-[hsl(var(--fg))]">
                  {g.header.subtitle}
                </div>
              ) : null}
            </div>

            {/* Assignment cards */}
            <div className="space-y-3">
              {g.rows.length === 0 ? (
                <Card variant="outline" tone="primary">
                  <CardHeader>
                    <div className="text-sm text-[hsl(var(--fg))]">Nothing Planned Yet</div>
                  </CardHeader>
                </Card>
              ) : (
                g.rows.map((row) => {
                  const submitted = Boolean(row.latestAttempt);
                  const title = formatAssignmentType(row.type);
                  const metaLeft = row.operation ? formatOperation(row.operation) : null;
                  const metaRight = formatAssignmentMode(row.mode);

                  return (
                    <button
                      key={row.assignmentId}
                      type="button"
                      onClick={() => router.push(`/student/assignments/${row.assignmentId}`)}
                      className="block w-full text-left"
                    >
                      <Card
                        variant="outline"
                        tone="primary"
                        className="transition hover:bg-[hsl(var(--surface-2))]"
                      >
                        <div className="flex items-start justify-between gap-4 px-5 py-4">
                          {/* Left */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-5">
                              <div className="truncate text-[15px] font-semibold text-[hsl(var(--fg))]">
                                {title}
                              </div>

                              {submitted ? Pill('Submitted', 'primary') : null}

                              {!submitted ? (
                                <span className="text-xs text-[hsl(var(--muted-fg))]">
                                  {row.status}
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1 text-sm text-[hsl(var(--fg))]">
                              {[metaLeft, metaRight].filter(Boolean).join(' · ')}
                            </div>

                            <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                              {formatWindowLine({ opensAt: row.opensAt, closesAt: row.closesAt })}
                            </div>
                          </div>

                          {/* Right */}
                          <div className="shrink-0 text-right">
                            {submitted && row.latestAttempt ? (
                              <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                                {row.latestAttempt.percent}%
                              </div>
                            ) : null}

                            <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                              {row.durationMinutes
                                ? `${row.durationMinutes} min`
                                : row.windowMinutes
                                  ? `${row.windowMinutes} min window`
                                  : '—'}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
