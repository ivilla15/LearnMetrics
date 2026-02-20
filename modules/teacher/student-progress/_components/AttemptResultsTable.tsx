'use client';

import * as React from 'react';

import {
  Button,
  Input,
  Label,
  HelpText,
  Pill,
  StatusDot,
  masteryTone,
  pctTone,
  missedTone,
} from '@/components';

import { formatLocal } from '@/lib/date';
import type {
  AttemptResultsFilterOption,
  AttemptResultsFilterKey,
  AttemptResultsRow,
} from '@/types/api/attempts';

function safeLower(s: string | undefined | null) {
  return (s ?? '').trim().toLowerCase();
}

export function AttemptResultsTable({
  rows,
  loading,

  searchEnabled = true,
  searchLabel = 'Search students',
  searchPlaceholder = 'Name or username…',

  filterOptions,
  filter,
  onChangeFilter,

  showStudentColumn,

  onViewDetails,

  helpText,
}: {
  rows: AttemptResultsRow[];
  loading: boolean;

  searchEnabled?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;

  filterOptions: AttemptResultsFilterOption[];
  filter: AttemptResultsFilterKey;
  onChangeFilter: (next: AttemptResultsFilterKey) => void;

  showStudentColumn: boolean;

  onViewDetails: (row: AttemptResultsRow) => void;

  helpText?: React.ReactNode;
}) {
  const [search, setSearch] = React.useState('');

  const canSearch = showStudentColumn && searchEnabled;

  const filtered = React.useMemo(() => {
    if (!canSearch) return rows;

    const q = safeLower(search);
    if (!q) return rows;

    return rows.filter((r) => {
      const hay = `${safeLower(r.name)} ${safeLower(r.username)}`;
      return hay.includes(q);
    });
  }, [rows, search, canSearch]);

  const colCount = showStudentColumn ? 8 : 7;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {canSearch ? (
          <div className="grid gap-1 min-w-60">
            <Label htmlFor="attempt-results-search">{searchLabel}</Label>
            <Input
              id="attempt-results-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        ) : null}

        <div className="grid gap-1">
          <Label>Filter</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => {
              const active = filter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChangeFilter(opt.key)}
                  className={[
                    'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div> : null}
      </div>

      <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
              {showStudentColumn ? <th className="py-3 pl-5 pr-3">Student</th> : null}
              <th className={showStudentColumn ? 'py-3 px-3' : 'py-3 pl-5 pr-3'}>Completed</th>
              <th className="py-3 px-3 text-center">Score</th>
              <th className="py-3 px-3 text-center">%</th>
              <th className="py-3 px-3 text-center">Missed</th>
              <th className="py-3 px-3 text-center">Mastery</th>
              <th className="py-3 px-3 text-center">Level at time</th>
              <th className="py-3 pl-3 pr-5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]"
                >
                  No rows match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => {
                const key =
                  (showStudentColumn && r.studentId ? `student-${r.studentId}` : null) ??
                  (r.attemptId ? `attempt-${r.attemptId}` : null) ??
                  `row-${idx}`;

                const isMissing = r.attemptId === null;

                return (
                  <tr
                    key={key}
                    className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
                  >
                    {showStudentColumn ? (
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-[hsl(var(--fg))] font-medium">{r.name ?? '—'}</div>
                          <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">
                            {r.username ?? '—'}
                          </div>
                          {isMissing ? (
                            <div className="pt-1">{Pill('Missing', 'warning')}</div>
                          ) : r.wasMastery ? (
                            <div className="pt-1">{Pill('Mastered', 'success')}</div>
                          ) : (
                            <div className="pt-1">{Pill('Not mastered', 'danger')}</div>
                          )}
                        </div>
                      </td>
                    ) : null}

                    <td
                      className={
                        showStudentColumn
                          ? 'py-3 px-3 whitespace-nowrap'
                          : 'py-3 pl-5 pr-3 whitespace-nowrap'
                      }
                    >
                      {formatLocal(r.completedAt)}
                      {!showStudentColumn ? (
                        <div className="pt-1">
                          {isMissing
                            ? Pill('Missing', 'warning')
                            : r.wasMastery
                              ? Pill('Mastered', 'success')
                              : Pill('Not mastered', 'danger')}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isMissing || r.score === null || r.total === null ? (
                        '—'
                      ) : (
                        <div className="inline-flex items-center gap-2 justify-center">
                          <StatusDot tone={masteryTone(r.wasMastery)} />
                          <span className="font-medium">
                            {r.score}/{r.total}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {r.percent === null ? (
                        '—'
                      ) : (
                        <div className="inline-flex items-center gap-2 justify-center">
                          <StatusDot tone={pctTone(r.percent)} />
                          <span className="font-medium">{r.percent}%</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {r.missed === null ? (
                        '—'
                      ) : (
                        <div className="inline-flex items-center gap-2 justify-center">
                          <StatusDot tone={missedTone(r.missed)} />
                          <span className="font-medium">{r.missed}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {r.wasMastery === null
                        ? '—'
                        : r.wasMastery
                          ? Pill('Yes', 'success')
                          : Pill('No', 'danger')}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {r.levelAtTime === null ? '—' : `Level ${r.levelAtTime}`}
                    </td>

                    <td className="py-3 pl-3 pr-5 text-right">
                      {r.attemptId ? (
                        <Button variant="secondary" size="sm" onClick={() => onViewDetails(r)}>
                          View details
                        </Button>
                      ) : (
                        <span className="text-xs text-[hsl(var(--muted-fg))]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {helpText ? <HelpText>{helpText}</HelpText> : null}
    </div>
  );
}
