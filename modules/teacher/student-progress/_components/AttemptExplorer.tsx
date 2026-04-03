'use client';

import * as React from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  MultiOpLevelProgressChart,
} from '@/components';

import { AttemptDetailModal } from './AttemptDetailModal';
import { AttemptResultsTable } from './AttemptResultsTable';
import { AttemptExplorerSkeleton } from '../../../skeletons/teacher/AttemptExplorerSkeleton';
import type { AttemptResultsRowDTO, AttemptExplorerFilter, AttemptRowDTO, OperationCode } from '@/types';
import type { AttemptRowForChart } from '@/components/MultiOpLevelProgressChart';
import { useAttemptExplorer } from '../hooks';

// ── Week grouping ──────────────────────────────────────────────────────────────

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  // Get Monday of this week
  const day = d.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

function formatWeekRange(weekKey: string): string {
  const mon = new Date(weekKey);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return `${fmt(mon)} – ${fmt(sun)}`;
}

type WeekGroup = {
  weekKey: string;
  label: string;
  attempts: AttemptRowDTO[];
  masteryRate: number;
};

function groupByWeek(attempts: AttemptRowDTO[]): WeekGroup[] {
  const map = new Map<string, AttemptRowDTO[]>();

  for (const a of attempts) {
    const key = getWeekKey(a.completedAt);
    const group = map.get(key) ?? [];
    group.push(a);
    map.set(key, group);
  }

  const groups: WeekGroup[] = [];

  for (const [weekKey, rows] of map.entries()) {
    const mastered = rows.filter((r) => r.wasMastery).length;
    const masteryRate = rows.length > 0 ? Math.round((mastered / rows.length) * 100) : 0;
    groups.push({
      weekKey,
      label: formatWeekRange(weekKey),
      attempts: rows,
      masteryRate,
    });
  }

  // Sort newest first
  groups.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  return groups;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttemptExplorer({
  baseUrl,
  hideControls = false,
  title = 'Attempts',
  description = 'Select one to view details.',
  chartTitle = 'Level progression',
  chartDescription = 'Each point shows the level after the test (mastery increases your level).',
  operationFilter,
  onAttemptsChange,
  currentLevel,
}: {
  baseUrl: string;
  hideControls?: boolean;
  title?: string;
  description?: string;
  chartTitle?: string;
  chartDescription?: string;
  operationFilter?: OperationCode | null;
  onAttemptsChange?: (attempts: AttemptRowDTO[]) => void;
  currentLevel?: number;
}) {
  const detailRef = React.useRef<HTMLDivElement | null>(null);
  const [expandedWeeks, setExpandedWeeks] = React.useState<Set<string>>(new Set());

  const {
    attempts,
    loading,
    filter,
    setFilter,

    nextCursor,
    loadingMore,
    loadMore,

    selectedAttemptId,
    setSelectedAttemptId,

    attemptDetail,
    openDetail,

    detailLoading,
    detailError,

    showIncorrectOnly,
    setShowIncorrectOnly,
  } = useAttemptExplorer(baseUrl, { operationFilter });

  // Notify parent when attempts change
  React.useEffect(() => {
    onAttemptsChange?.(attempts);
  }, [attempts, onAttemptsChange]);

  React.useEffect(() => {
    if (!attemptDetail) return;
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [attemptDetail]);

  const modalOpen = selectedAttemptId !== null;

  const chartAttempts: AttemptRowForChart[] = attempts.map((a) => ({
    attemptId: a.attemptId,
    completedAt: a.completedAt,
    operation: a.operation,
    levelAtTime: a.levelAtTime,
    wasMastery: a.wasMastery,
    percent: a.percent,
  }));

  const weekGroups = React.useMemo(() => groupByWeek(attempts), [attempts]);

  function toggleWeek(weekKey: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      return next;
    });
  }

  function toTableRow(a: AttemptRowDTO): AttemptResultsRowDTO {
    const missed = Math.max(0, a.total - a.score);
    return {
      attemptId: a.attemptId,
      completedAt: a.completedAt,
      operation: a.operation,
      type: a.type,
      score: a.score,
      total: a.total,
      percent: a.percent,
      missed,
      wasMastery: a.wasMastery,
      levelAtTime: a.levelAtTime,
    };
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <AttemptExplorerSkeleton />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{chartTitle}</CardTitle>
              <CardDescription>{chartDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiOpLevelProgressChart
                attempts={chartAttempts}
                currentLevel={currentLevel}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>

                {!hideControls ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[hsl(var(--muted-fg))]" htmlFor="filter-select">
                      Filter
                    </label>
                    <select
                      id="filter-select"
                      className="h-10 rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as AttemptExplorerFilter)}
                    >
                      <option value="ALL">All</option>
                      <option value="MASTERY">Mastery only</option>
                      <option value="NOT_MASTERY">Not mastery only</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {attempts.length === 0 ? (
                <div className="text-sm text-[hsl(var(--muted-fg))]">No attempts yet.</div>
              ) : (
                <>
                  {/* Week-grouped rows */}
                  <div className="space-y-2">
                    {weekGroups.map((group) => {
                      const isExpanded = expandedWeeks.has(group.weekKey);
                      return (
                        <div key={group.weekKey}>
                          {/* Week header */}
                          <button
                            type="button"
                            onClick={() => toggleWeek(group.weekKey)}
                            className="w-full flex items-center justify-between rounded-[14px] border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-[hsl(var(--surface-2))] px-4 py-2.5 text-sm cursor-pointer hover:bg-[hsl(var(--surface))] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-[hsl(var(--fg))]">
                                {group.label}
                              </span>
                              <span className="text-xs text-[hsl(var(--muted-fg))]">
                                {group.attempts.length} attempt{group.attempts.length !== 1 ? 's' : ''}
                              </span>
                              <span
                                className={[
                                  'text-xs font-medium',
                                  group.masteryRate >= 85
                                    ? 'text-[hsl(var(--success))]'
                                    : group.masteryRate >= 70
                                      ? 'text-[hsl(var(--warning))]'
                                      : 'text-[hsl(var(--danger))]',
                                ].join(' ')}
                              >
                                {group.masteryRate}% mastery
                              </span>
                            </div>
                            <span className="text-[hsl(var(--muted-fg))] text-xs">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {/* Expanded week rows */}
                          {isExpanded ? (
                            <div className="mt-2">
                              <AttemptResultsTable
                                rows={group.attempts.map(toTableRow)}
                                loading={detailLoading}
                                showStudentColumn={false}
                                searchEnabled={false}
                                filterOptions={[
                                  { key: 'ALL', label: 'All' },
                                  { key: 'MASTERY', label: 'Mastery' },
                                  { key: 'NOT_MASTERY', label: 'Not mastery' },
                                ]}
                                filter={filter}
                                onChangeFilter={(key) => setFilter(key as AttemptExplorerFilter)}
                                onViewDetails={(row) => {
                                  if (!row.attemptId) return;
                                  void openDetail(row.attemptId);
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {!hideControls && nextCursor ? (
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                        {loadingMore ? 'Loading…' : 'Load more'}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <div ref={detailRef} />
        </>
      )}

      <AttemptDetailModal
        open={modalOpen && !hideControls}
        onClose={() => setSelectedAttemptId(null)}
        title="Attempt details"
        detail={attemptDetail}
        loading={detailLoading}
        error={detailError}
        showIncorrectOnly={showIncorrectOnly}
        onToggleIncorrectOnly={setShowIncorrectOnly}
      />
    </div>
  );
}
