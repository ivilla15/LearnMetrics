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
} from '@/components';
import type { ClassroomProgressStudentRowDTO, FilterKey } from '@/types';
import { formatLocal } from '@/lib/date';
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
    hasLastTest,
    onGoStudent,
    onPrintStudent,
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
                  <th className="py-3 px-3">Last attempt</th>
                  <th className="py-3 px-3 text-center">Last %</th>
                  <th className="py-3 px-3 text-center">Avg %</th>
                  <th className="py-3 px-3 text-center">Mastery %</th>
                  <th className="py-3 px-3 text-center">Streak</th>
                  <th className="py-3 px-3">Trend</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]">
                      No students match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
                    >
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-[hsl(var(--fg))] font-medium">{s.name}</div>
                          <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">
                            {s.username}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {s.flags?.needsSetup ? (
                              <Badge tone="warning">Needs setup</Badge>
                            ) : (
                              <Badge tone="success">Active</Badge>
                            )}
                            {s.flags?.atRisk && <Badge tone="danger">At-risk</Badge>}
                            {s.flags?.stale14Days && <Badge tone="warning">14+ days</Badge>}
                            {s.flags?.nonMasteryStreak2 && (
                              <Badge tone="warning">2+ not mastery</Badge>
                            )}
                            {s.flags?.missedLastTest && (
                              <Badge tone="warning">Missed last test</Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">{s.level}</td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div>{formatLocal(s.lastAttemptAt)}</div>
                          {hasLastTest ? (
                            s.flags?.missedLastTest ? (
                              <Badge tone="warning">Missing</Badge>
                            ) : s.flags?.lastTestMastery ? (
                              <Badge tone="success">Mastered</Badge>
                            ) : s.flags?.lastTestAttempted ? (
                              <Badge tone="danger">Not mastered</Badge>
                            ) : (
                              <Badge tone="muted">—</Badge>
                            )
                          ) : (
                            <Badge tone="muted">—</Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {s.lastPercent === null ? (
                          '—'
                        ) : (
                          <span className="inline-flex justify-center">
                            <Badge tone={pctTone(s.lastPercent)}>{s.lastPercent}%</Badge>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {s.avgPercentInRange === null ? (
                          '—'
                        ) : (
                          <span className="inline-flex justify-center">
                            <Badge tone={pctTone(s.avgPercentInRange)}>
                              {s.avgPercentInRange}%
                            </Badge>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {s.masteryRateInRange === null ? (
                          '—'
                        ) : (
                          <span className="inline-flex justify-center">
                            <Badge tone={pctTone(s.masteryRateInRange)}>
                              {s.masteryRateInRange}%
                            </Badge>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {s.masteryStreak > 0 ? (
                          <Badge tone="success">M{s.masteryStreak}</Badge>
                        ) : s.nonMasteryStreak > 0 ? (
                          <Badge tone="danger">N{s.nonMasteryStreak}</Badge>
                        ) : (
                          <Badge tone="warning">0</Badge>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {s.trendLast3 === 'improving' ? (
                          <Badge tone="success">Improving</Badge>
                        ) : s.trendLast3 === 'regressing' ? (
                          <Badge tone="warning">Regressing</Badge>
                        ) : s.trendLast3 === 'flat' ? (
                          <Badge tone="muted">Flat</Badge>
                        ) : (
                          <Badge tone="muted">Need 3 attempts</Badge>
                        )}
                      </td>

                      <td className="py-3 pl-3 pr-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => onGoStudent(s.id)}
                          >
                            View
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => onPrintStudent(s.id)}
                          >
                            Print report
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
