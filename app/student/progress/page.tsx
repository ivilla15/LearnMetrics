'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { StudentShell } from '@/components/shell/StudentShell';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';

import { LevelProgressChart } from '@/components/LevelProgressChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type AttemptRow = {
  attemptId: number;
  assignmentId: number;
  completedAt: string;
  assignmentKind: string;
  assignmentMode: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
};

type AttemptDetail = {
  attemptId: number;
  completedAt: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  items: {
    id: number;
    prompt: string;
    studentAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
};

function ProgressSkeleton() {
  return (
    <>
      <Section>
        <Card>
          <CardHeader>
            <CardTitle>Level progression</CardTitle>
            <CardDescription>Loading your chart…</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </Section>

      <Section>
        <Card>
          <CardHeader>
            <CardTitle>Attempts</CardTitle>
            <CardDescription>Loading your history…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </Section>
    </>
  );
}

export default function StudentProgressPage() {
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/student/dashboard' },
      { label: 'Progress', href: '/student/progress' },
      { label: 'Logout', href: '/student/logout' },
    ],
    [],
  );

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  const [filter, setFilter] = useState<'ALL' | 'MASTERY' | 'NOT_MASTERY'>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFirstPage() {
      setLoading(true);

      const res = await fetch(`/api/student/attempts?filter=${filter}`);

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
      setDetailError(null);
      setDetailLoading(false);
    }

    void loadFirstPage();
  }, [filter]);

  async function loadMore() {
    if (!nextCursor) return;

    setLoadingMore(true);

    const res = await fetch(`/api/student/attempts?filter=${filter}&cursor=${nextCursor}`);

    if (!res.ok) {
      setLoadingMore(false);
      return;
    }

    const data = await res.json().catch(() => null);
    const newRows = Array.isArray(data?.rows) ? data.rows : [];
    const newCursor = typeof data?.nextCursor === 'string' ? data.nextCursor : null;

    setAttempts((prev) => [...prev, ...newRows]);
    setNextCursor(newCursor);
    setLoadingMore(false);
  }

  useEffect(() => {
    if (!selectedAttemptId) return;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);

      const res = await fetch(`/api/student/attempts/${selectedAttemptId}`);

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setAttemptDetail(null);
        setDetailError(err?.error ?? 'Failed to load attempt details');
        setDetailLoading(false);
        return;
      }

      const data = await res.json().catch(() => null);
      setAttemptDetail(data);
      setDetailLoading(false);
    }

    void loadDetail();
  }, [selectedAttemptId]);

  return (
    <StudentShell navItems={navItems} currentPath={pathname} width="wide">
      <PageHeader
        title="Progress"
        subtitle="Review your past tests and see how your level changes over time."
      />

      {loading ? (
        <ProgressSkeleton />
      ) : (
        <>
          {/* Chart */}
          <Section>
            <Card>
              <CardHeader>
                <CardTitle>Level progression</CardTitle>
                <CardDescription>
                  Each point shows your level at the time you completed a test.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LevelProgressChart attempts={attempts} />
              </CardContent>
            </Card>
          </Section>

          {/* Attempts */}
          <Section>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Attempts</CardTitle>
                    <CardDescription>Select one to view details.</CardDescription>
                  </div>

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
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {attempts.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-fg))]">No attempts yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-[hsl(var(--border))]">
                          <th className="py-2 pr-3">Date</th>
                          <th className="py-2 pr-3">Level</th>
                          <th className="py-2 pr-3">Score</th>
                          <th className="py-2 pr-3">Result</th>
                          <th className="py-2 pr-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((a) => {
                          const isThisRowLoading =
                            detailLoading && selectedAttemptId === a.attemptId;

                          return (
                            <tr
                              key={a.attemptId}
                              className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]"
                            >
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {new Date(a.completedAt).toLocaleString()}
                              </td>
                              <td className="py-2 pr-3">{a.levelAtTime}</td>
                              <td className="py-2 pr-3">
                                {a.score}/{a.total} ({a.percent}%)
                              </td>
                              <td className="py-2 pr-3">
                                {a.wasMastery ? 'Mastery' : 'Not mastery'}
                              </td>
                              <td className="py-2 pr-3">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={isThisRowLoading}
                                  onClick={() => {
                                    setAttemptDetail(null);
                                    setDetailError(null);
                                    setSelectedAttemptId(a.attemptId);
                                  }}
                                >
                                  {isThisRowLoading ? 'Loading…' : 'View details'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {nextCursor ? (
                  <div>
                    <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </Section>

          {/* Detail loading / error */}
          {detailLoading ? (
            <Section>
              <Card>
                <CardContent className="py-6">
                  <div className="text-sm text-[hsl(var(--muted-fg))]">
                    Loading attempt details…
                  </div>
                </CardContent>
              </Card>
            </Section>
          ) : null}

          {detailError ? (
            <Section>
              <Card>
                <CardContent className="py-6">
                  <div className="text-sm text-[hsl(var(--danger))]">{detailError}</div>
                </CardContent>
              </Card>
            </Section>
          ) : null}

          {/* Detail panel */}
          {attemptDetail ? (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Attempt details</CardTitle>
                  <CardDescription>
                    Score: {attemptDetail.score}/{attemptDetail.total} ({attemptDetail.percent}%)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showIncorrectOnly}
                      onChange={(e) => setShowIncorrectOnly(e.target.checked)}
                    />
                    Show incorrect only
                  </label>

                  <ul className="space-y-2 text-sm">
                    {attemptDetail.items
                      .filter((it) => !showIncorrectOnly || !it.isCorrect)
                      .map((it) => (
                        <li
                          key={it.id}
                          className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.6)] p-3"
                        >
                          <div className="font-medium">{it.prompt}</div>
                          <div className="text-[hsl(var(--muted-fg))]">
                            Your answer: {it.studentAnswer === -1 ? '—' : it.studentAnswer} ·
                            Correct: {it.correctAnswer} {it.isCorrect ? '✅' : '❌'}
                          </div>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </Section>
          ) : null}
        </>
      )}
    </StudentShell>
  );
}
