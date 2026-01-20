'use client';

import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  LevelProgressChart,
} from '@/components';

import { AttemptDetailModal, AttemptResultsTable, type AttemptResultsRow } from '@/modules';
import { AttemptDetail, AttemptRow } from '@/types';

function ProgressSkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-72" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-52" />
            </div>
            <Skeleton className="h-10 w-44 rounded-[var(--radius)]" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </>
  );
}

type MeShape = { id: number; name: string; username: string };

function toNumberId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseMeCandidate(value: unknown): MeShape | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;

  // IMPORTANT: accept id OR studentId OR userId
  const id =
    toNumberId(v.id) ?? toNumberId(v.studentId) ?? toNumberId(v.userId) ?? toNumberId(v.student_id);

  const name = typeof v.name === 'string' ? v.name : null;
  const username = typeof v.username === 'string' ? v.username : null;

  if (!id || !name || !username) return null;
  return { id, name, username };
}

function pickCandidate(root: Record<string, unknown> | null): unknown {
  if (!root) return null;

  // Try common server response shapes
  return (
    root.student ??
    root.me ??
    root.data ??
    root.user ??
    root.profile ??
    root.result ??
    // sometimes the student is nested again
    (typeof root.student === 'object' && root.student
      ? ((root.student as Record<string, unknown>).student ?? root.student)
      : null) ??
    root
  );
}

export function AttemptExplorer({
  baseUrl,
  hideControls = false,
  title = 'Attempts',
  description = 'Select one to view details.',
  chartTitle = 'Level progression',
  chartDescription = 'Each point shows the level after the test (mastery increases your level).',

  // optional overrides from parent (recommended for teacher student progress page)
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
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'ALL' | 'MASTERY' | 'NOT_MASTERY'>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  const detailRef = useRef<HTMLDivElement | null>(null);

  const [me, setMe] = useState<MeShape | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      const res = await fetch(`${baseUrl}/me`);
      if (!res.ok) {
        if (!cancelled) setMe(null);
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

      const candidate = pickCandidate(root);
      const parsed = parseMeCandidate(candidate);

      if (!cancelled) setMe(parsed);
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);

      const res = await fetch(`${baseUrl}/attempts?filter=${filter}`);
      if (cancelled) return;

      if (!res.ok) {
        setAttempts([]);
        setNextCursor(null);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => null);
      setAttempts(Array.isArray(data?.rows) ? data.rows : []);
      setNextCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : null);
      setLoading(false);

      setSelectedAttemptId(null);
      setAttemptDetail(null);
      setShowIncorrectOnly(false);
      setDetailError(null);
      setDetailLoading(false);
    }

    void loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, filter]);

  useEffect(() => {
    if (!selectedAttemptId) {
      setAttemptDetail(null);
      setShowIncorrectOnly(false);
      setDetailError(null);
      setDetailLoading(false);
    }
  }, [selectedAttemptId]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);

    const res = await fetch(`${baseUrl}/attempts?filter=${filter}&cursor=${nextCursor}`);
    if (!res.ok) {
      setLoadingMore(false);
      return;
    }

    const data = await res.json().catch(() => null);
    const newRows = Array.isArray(data?.rows) ? (data.rows as AttemptRow[]) : [];
    const newCursor = typeof data?.nextCursor === 'string' ? data.nextCursor : null;

    setAttempts((prev) => [...prev, ...newRows]);
    setNextCursor(newCursor);
    setLoadingMore(false);
  }

  async function openDetail(attemptId: number) {
    setSelectedAttemptId(attemptId);
    setAttemptDetail(null);
    setShowIncorrectOnly(false);
    setDetailError(null);

    setDetailLoading(true);
    const res = await fetch(`${baseUrl}/attempts/${attemptId}`);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setAttemptDetail(null);
      setDetailError(err?.error ?? 'Failed to load attempt details');
      setDetailLoading(false);
      return;
    }

    const data = (await res.json().catch(() => null)) as AttemptDetail | null;
    setAttemptDetail(data);
    setDetailLoading(false);

    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

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
        <ProgressSkeleton />
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
                      className="h-10 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
                      value={filter}
                      onChange={(e) =>
                        setFilter(e.target.value as 'ALL' | 'MASTERY' | 'NOT_MASTERY')
                      }
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
                  onChangeFilter={(key) => setFilter(key as 'ALL' | 'MASTERY' | 'NOT_MASTERY')}
                  onViewDetails={(row) => {
                    if (!row.attemptId) return;
                    void openDetail(row.attemptId);
                  }}
                  helpText={
                    hideControls
                      ? null
                      : nextCursor
                        ? null
                        : 'New attempts will appear at the bottom.'
                  }
                />
              )}

              {!hideControls && nextCursor ? (
                <div className="flex items-center gap-3">
                  <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">
                    New attempts will appear at the bottom.
                  </div>
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
