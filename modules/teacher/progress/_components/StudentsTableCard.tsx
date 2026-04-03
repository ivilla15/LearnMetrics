'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
} from '@/components';
import type { ClassroomProgressStudentRowDTO, FilterKey } from '@/types';
import { CLASSROOM_PROGRESS_FILTER_KEYS, pctTone } from '@/types';

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  atRisk: 'At-risk',
  stale14: '14+ days',
  missedLastTest: 'Missed last test',
  streak2: '2+ not mastery',
  masteryStreak2: '2+ mastery',
  needsSetup: 'Needs setup',
  improving: 'Improving',
  regressing: 'Regressing',
};

const FILTERS = CLASSROOM_PROGRESS_FILTER_KEYS.map((key) => [key, FILTER_LABELS[key]] as const);

function formatLastActive(days: number | null): { text: string; stale: boolean } {
  if (days === null) return { text: '—', stale: false };
  if (days === 0) return { text: 'Today', stale: false };
  if (days === 1) return { text: 'Yesterday', stale: false };
  if (days >= 14) return { text: `${days} days ago`, stale: true };
  return { text: `${days} days ago`, stale: false };
}

type TrendIcon = { icon: string; label: string; tone: 'success' | 'muted' | 'danger' };

function trendDisplay(trend: ClassroomProgressStudentRowDTO['trendLast3']): TrendIcon {
  switch (trend) {
    case 'improving':
      return { icon: '↑', label: 'Improving', tone: 'success' };
    case 'regressing':
      return { icon: '↓', label: 'Regressing', tone: 'danger' };
    case 'flat':
      return { icon: '→', label: 'Steady', tone: 'muted' };
    default:
      return { icon: '—', label: 'Need 3', tone: 'muted' };
  }
}

export function StudentsTableCard(props: {
  tableRef: React.RefObject<HTMLDivElement | null>;

  daysText: string;
  setDaysText: (v: string) => void;
  onApplyDays: () => void;
  loading: boolean;

  search: string;
  setSearch: (v: string) => void;

  filter: FilterKey;
  setFilter: (k: FilterKey) => void;

  filtered: ClassroomProgressStudentRowDTO[];

  hasLastTest: boolean;

  classroomId: number;
  onGoStudent: (studentId: number) => void;
  onPrintStudent: (studentId: number) => void;
  onClearFilters: () => void;
}) {
  const {
    tableRef,
    daysText,
    setDaysText,
    onApplyDays,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    filtered,
    onGoStudent,
    onClearFilters,
  } = props;

  return (
    <div ref={tableRef}>
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Filters apply only to this table.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1">
              <Label htmlFor="days">Range (days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="days"
                  inputMode="numeric"
                  value={daysText}
                  onChange={(e) => setDaysText(e.target.value)}
                  className="w-27.5"
                />
                <Button variant="secondary" onClick={onApplyDays} disabled={loading}>
                  {loading ? 'Loading…' : 'Apply'}
                </Button>
              </div>
            </div>

            <div className="grid gap-1 min-w-60">
              <Label htmlFor="search">Search students</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or username…"
              />
            </div>

            <div className="grid gap-1">
              <Label>Filter</Label>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(([key, label]) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={[
                        'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={onClearFilters}
                  className="cursor-pointer rounded-[999px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--surface-2))]"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
                  <th className="py-3 pl-5 pr-3">Student</th>
                  <th className="py-3 px-3 text-center">Level</th>
                  <th className="py-3 px-3">Mastery Rate</th>
                  <th className="py-3 px-3 text-center">Avg Score</th>
                  <th className="py-3 px-3">Trend</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-[hsl(var(--border))] last:border-b-0">
                      <td className="py-3 pl-5 pr-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      {Array.from({ length: 6 }, (_, j) => (
                        <td key={j} className="py-3 px-3">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </td>
                      ))}
                      <td className="py-3 pl-3 pr-5">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]">
                      No students match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const lastActive = formatLastActive(s.daysSinceLastAttempt);
                    const trend = trendDisplay(s.trendLast3);
                    const isAtRisk = !!s.flags?.atRisk;

                    return (
                      <tr
                        key={s.id}
                        className={[
                          'border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]',
                          isAtRisk ? 'border-l-2 border-l-[hsl(var(--danger))]' : 'border-l-2 border-l-transparent',
                        ].join(' ')}
                      >
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[hsl(var(--fg))] font-medium">{s.name}</div>
                            <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">
                              {s.username}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-medium">{s.level}</td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-[hsl(var(--fg))]">
                            {s.masteryRateInRange}%
                          </div>
                          <div className="text-xs text-[hsl(var(--muted-fg))]">
                            {s.attemptsInRange} attempts
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge tone={pctTone(s.avgPercentInRange)}>
                            {s.avgPercentInRange}%
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <Badge tone={trend.tone}>
                            {trend.icon} {trend.label}
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={
                              lastActive.stale
                                ? 'text-[hsl(var(--warning))] font-medium'
                                : 'text-[hsl(var(--fg))]'
                            }
                          >
                            {lastActive.text}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {isAtRisk && <Badge tone="danger">At-risk</Badge>}
                            {s.flags?.noAttemptsInRange && (
                              <Badge tone="muted">No attempts</Badge>
                            )}
                            {s.flags?.missedLastTest && (
                              <Badge tone="warning">Missed test</Badge>
                            )}
                            {s.flags?.needsSetup && (
                              <Badge tone="warning">Needs setup</Badge>
                            )}
                            {!isAtRisk &&
                              !s.flags?.noAttemptsInRange &&
                              !s.flags?.missedLastTest &&
                              !s.flags?.needsSetup && (
                                <Badge tone="success">Active</Badge>
                              )}
                          </div>
                        </td>

                        <td className="py-3 pl-3 pr-5 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => onGoStudent(s.id)}
                          >
                            View Progress
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
