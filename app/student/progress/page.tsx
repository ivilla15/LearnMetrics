'use client';

import { useEffect, useState } from 'react';
import { LevelProgressChart } from '@/components/LevelProgressChart';
import { StudentNav } from '@/components/StudentNav';

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

export default function StudentProgressPage() {
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  // NEW: filter + pagination
  const [filter, setFilter] = useState<'ALL' | 'MASTERY' | 'NOT_MASTERY'>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // NEW: detail UX hardening
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Load first page (re-runs when filter changes)
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

      // If filter changes, clear any open detail view
      setSelectedAttemptId(null);
      setAttemptDetail(null);
      setDetailError(null);
      setDetailLoading(false);
    }

    loadFirstPage();
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

  // Load attempt detail when selected
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

    loadDetail();
  }, [selectedAttemptId]);

  if (loading) {
    return <p>Loading progress…</p>;
  }

  return (
    <>
      <StudentNav />
      <div style={{ padding: 24 }}>
        <h1>Your Progress</h1>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Level progression</h2>
            <p style={{ fontSize: 12, color: '#555' }}>
              Each point represents the student’s level at the time of a completed test.
            </p>
          </div>

          <LevelProgressChart attempts={attempts} />
        </div>

        {/* Filter */}
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <label htmlFor="filter-select" style={{ marginRight: 8 }}>
            Filter
          </label>
          <select
            id="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'MASTERY' | 'NOT_MASTERY')}
          >
            <option value="ALL">All</option>
            <option value="MASTERY">Mastery only</option>
            <option value="NOT_MASTERY">Not mastery only</option>
          </select>
        </div>

        {attempts.length === 0 ? (
          <p>No attempts yet.</p>
        ) : (
          <>
            <table border={1} cellPadding={8}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Level</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const isThisRowLoading = detailLoading && selectedAttemptId === a.attemptId;

                  return (
                    <tr key={a.attemptId}>
                      <td>{new Date(a.completedAt).toLocaleString()}</td>
                      <td>{a.levelAtTime}</td>
                      <td>
                        {a.score}/{a.total} ({a.percent}%)
                      </td>
                      <td>{a.wasMastery ? 'Mastery' : 'Not mastery'}</td>
                      <td>
                        <button
                          onClick={() => {
                            setAttemptDetail(null);
                            setDetailError(null);
                            setSelectedAttemptId(a.attemptId);
                          }}
                          disabled={isThisRowLoading}
                        >
                          {isThisRowLoading ? 'Loading…' : 'View details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Load more */}
            {nextCursor && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{ marginTop: 12, padding: '6px 10px' }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}

            {/* Hint */}
            {attempts.length > 0 && !attemptDetail && !detailLoading && !detailError && (
              <p style={{ marginTop: 16 }}>Select an attempt to view details.</p>
            )}
          </>
        )}

        {/* Detail states */}
        {detailLoading && <p style={{ marginTop: 12 }}>Loading attempt details…</p>}
        {detailError && <p style={{ marginTop: 12, color: 'red' }}>{detailError}</p>}

        {/* Detail panel */}
        {attemptDetail && (
          <div style={{ marginTop: 32 }}>
            <h2>Attempt Details</h2>

            <p>
              Score: {attemptDetail.score}/{attemptDetail.total} ({attemptDetail.percent}%)
            </p>

            <label>
              <input
                type="checkbox"
                checked={showIncorrectOnly}
                onChange={(e) => setShowIncorrectOnly(e.target.checked)}
              />{' '}
              Show incorrect only
            </label>

            <ul>
              {attemptDetail.items
                .filter((it) => !showIncorrectOnly || !it.isCorrect)
                .map((it) => (
                  <li key={it.id}>
                    {it.prompt} → your answer: {it.studentAnswer === -1 ? '—' : it.studentAnswer},{' '}
                    correct: {it.correctAnswer} {it.isCorrect ? '✅' : '❌'}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
