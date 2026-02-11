'use client';

import * as React from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  LevelProgressChart,
} from '@/components';

import { AttemptDetailModal } from './AttemptDetailModal';
import { AttemptResultsTable } from './AttemptResultsTable';
import { AttemptExplorerSkeleton } from './AttemptExplorerSkeleton';

import type { AttemptResultsRow, AttemptExplorerFilter } from '@/types/attempts';
import { useAttemptExplorer } from '../hooks';

export function AttemptExplorer({
  baseUrl,
  hideControls = false,
  title = 'Attempts',
  description = 'Select one to view details.',
  chartTitle = 'Level progression',
  chartDescription = 'Each point shows the level after the test (mastery increases your level).',

  studentId,
  studentName,
  studentUsername,
}: {
  baseUrl: string;
  hideControls?: boolean;
  title?: string;
  description?: string;
  chartTitle?: string;
  chartDescription?: string;

  studentId?: number | null;
  studentName?: string;
  studentUsername?: string;
}) {
  const detailRef = React.useRef<HTMLDivElement | null>(null);

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

    me,
  } = useAttemptExplorer(baseUrl);

  React.useEffect(() => {
    if (!attemptDetail) return;
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [attemptDetail]);

  const modalOpen = selectedAttemptId !== null;

  const tableRows: AttemptResultsRow[] = attempts.map((a) => {
    const missed = Math.max(0, a.total - a.score);
    return {
      attemptId: a.attemptId,
      completedAt: a.completedAt,
      score: a.score,
      total: a.total,
      percent: a.percent,
      missed,
      wasMastery: a.wasMastery,
      levelAtTime: a.levelAtTime,
    };
  });

  const resolvedStudentId = studentId ?? me?.id ?? null;
  const resolvedStudentName = studentName ?? me?.name ?? null;
  const resolvedStudentUsername = studentUsername ?? me?.username ?? null;

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
              <LevelProgressChart attempts={attempts} />
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
                <AttemptResultsTable
                  rows={tableRows}
                  loading={loading || detailLoading}
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
              )}

              {!hideControls && nextCursor ? (
                <div className="flex items-center gap-3">
                  <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div ref={detailRef} />
        </>
      )}

      <AttemptDetailModal
        open={modalOpen && !hideControls}
        onClose={() => setSelectedAttemptId(null)}
        title="Attempt details"
        studentId={resolvedStudentId}
        studentName={resolvedStudentName}
        studentUsername={resolvedStudentUsername}
        detail={attemptDetail}
        loading={detailLoading}
        error={detailError}
        showIncorrectOnly={showIncorrectOnly}
        onToggleIncorrectOnly={setShowIncorrectOnly}
      />
    </div>
  );
}
