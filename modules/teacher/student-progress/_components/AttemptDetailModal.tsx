'use client';

import * as React from 'react';

import { Modal, Button } from '@/components';
import { cn } from '@/lib';
import type { AttemptDetailDTO } from '@/types';
import type { AttemptReviewStatus } from '@/types/api/assignments';
import { formatAnswer } from '@/types';

const EVENT_LABELS: Record<string, string> = {
  TAB_HIDDEN: 'Tab hidden',
  WINDOW_BLUR: 'Window blur',
  LEFT_PAGE: 'Left page',
  COPY_BLOCKED: 'Copy blocked',
  CUT_BLOCKED: 'Cut blocked',
  PASTE_BLOCKED: 'Paste blocked',
};

// Events with higher severity appear in red
const HIGH_SEVERITY = new Set(['LEFT_PAGE', 'TAB_HIDDEN']);

type IntegrityEvent = { id: number; eventType: string; occurredAt: string };

type ReviewState = {
  status: AttemptReviewStatus;
  note: string;
  saving: boolean;
  error: string | null;
};

export function AttemptDetailModal({
  open,
  onClose,
  title = 'Attempt details',

  classroomId,
  assignmentId,
  attemptId,

  studentId,
  studentName,
  studentUsername,

  detail,
  loading,
  error,

  showIncorrectOnly,
  onToggleIncorrectOnly,

  initialReviewStatus,
  onReviewChanged,
}: {
  open: boolean;
  onClose: () => void;

  title?: string;

  /** Required to load events and submit review actions */
  classroomId?: number | null;
  assignmentId?: number | null;
  attemptId?: number | null;

  studentId?: number | null;
  studentName?: string | null;
  studentUsername?: string | null;

  detail: AttemptDetailDTO | null;
  loading: boolean;
  error: string | null;

  showIncorrectOnly: boolean;
  onToggleIncorrectOnly: (next: boolean) => void;

  initialReviewStatus?: AttemptReviewStatus | null;
  /** Called after a review status change so parent can refresh rows */
  onReviewChanged?: (attemptId: number, newStatus: AttemptReviewStatus) => void;
}) {
  const [tab, setTab] = React.useState<'questions' | 'integrity'>('questions');

  // Integrity events
  const [events, setEvents] = React.useState<IntegrityEvent[] | null>(null);
  const [eventsLoading, setEventsLoading] = React.useState(false);

  // Review panel
  const [review, setReview] = React.useState<ReviewState>({
    status: initialReviewStatus ?? 'VALID',
    note: '',
    saving: false,
    error: null,
  });

  // Reset when modal opens
  React.useEffect(() => {
    if (!open) return;
    setTab('questions');
    setEvents(null);
    setReview({
      status: initialReviewStatus ?? 'VALID',
      note: '',
      saving: false,
      error: null,
    });
  }, [open, initialReviewStatus]);

  // Load events when integrity tab is opened
  React.useEffect(() => {
    if (tab !== 'integrity' || !open) return;
    if (!classroomId || !assignmentId || !studentId) return;
    if (events !== null) return; // already loaded

    let cancelled = false;
    setEventsLoading(true);
    fetch(
      `/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/events?studentId=${studentId}`,
      { credentials: 'include', cache: 'no-store' },
    )
      .then((r) => r.json())
      .then((j: unknown) => {
        if (cancelled) return;
        const rec = j as Record<string, unknown>;
        setEvents(Array.isArray(rec.events) ? (rec.events as IntegrityEvent[]) : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, open, classroomId, assignmentId, studentId, events]);

  async function saveReview() {
    if (!classroomId || !assignmentId || !attemptId) return;
    setReview((r) => ({ ...r, saving: true, error: null }));
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/attempts/${attemptId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reviewStatus: review.status, reviewNote: review.note || null }),
        },
      );
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setReview((r) => ({ ...r, saving: false, error: json?.error ?? 'Failed to save' }));
        return;
      }
      setReview((r) => ({ ...r, saving: false }));
      onReviewChanged?.(attemptId, review.status);
    } catch {
      setReview((r) => ({ ...r, saving: false, error: 'Failed to save' }));
    }
  }

  const headerLine = detail
    ? `Score: ${detail.score}/${detail.total} (${detail.percent}%)`
    : loading
      ? 'Loading attempt details…'
      : error
        ? 'Error loading attempt details'
        : 'Select an attempt to view details.';

  const hasStudentMeta =
    typeof studentName === 'string' ||
    typeof studentUsername === 'string' ||
    typeof studentId === 'number';

  const studentLine = hasStudentMeta
    ? [
        typeof studentName === 'string' && studentName.trim() ? studentName.trim() : 'Student',
        typeof studentUsername === 'string' && studentUsername.trim()
          ? `(@${studentUsername.trim()})`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  const canShowIntegrity = Boolean(classroomId && assignmentId && studentId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={
        <div className="space-y-1">
          {studentLine ? (
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">{studentLine}</div>
          ) : null}
          <div className="text-base font-semibold text-[hsl(var(--fg))]">{headerLine}</div>
          {detail ? (
            <div className="text-xs text-[hsl(var(--muted-fg))]">
              Completed: {new Date(detail.completedAt).toLocaleString()}
              <span className="ml-3">Level at time: {detail.levelAtTime}</span>
            </div>
          ) : null}
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 border-b border-[hsl(var(--border))]">
        {(['questions', 'integrity'] as const).map((t) => {
          if (t === 'integrity' && !canShowIntegrity) return null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'border-b-2 border-[hsl(var(--brand))] text-[hsl(var(--brand))]'
                  : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]',
              )}
            >
              {t === 'questions' ? 'Questions' : 'Integrity & Review'}
            </button>
          );
        })}
      </div>

      {/* Questions tab */}
      {tab === 'questions' ? (
        loading ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
        ) : error ? (
          <div className="text-sm text-[hsl(var(--danger))]">{error}</div>
        ) : !detail ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No details loaded.</div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showIncorrectOnly}
                onChange={(e) => onToggleIncorrectOnly(e.target.checked)}
              />
              Show incorrect only
            </label>

            <ul className="space-y-2 text-sm">
              {detail.items
                .filter((it) => !showIncorrectOnly || !it.isCorrect)
                .map((it) => (
                  <li
                    key={it.id}
                    className={cn(
                      'rounded-(--radius) border border-l-4 p-3',
                      it.isCorrect
                        ? 'border-[hsl(var(--success)/0.4)] border-l-[hsl(var(--success))] bg-[hsl(var(--success)/0.12)]'
                        : 'border-[hsl(var(--danger)/0.4)] border-l-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.12)]',
                    )}
                  >
                    <div className="font-medium text-[hsl(var(--fg))]">{it.prompt}</div>
                    <div className="mt-1 text-[hsl(var(--muted-fg))]">
                      Your answer:{' '}
                      <span className="font-medium text-[hsl(var(--fg))]">
                        {it.studentAnswer !== null ? formatAnswer(it.studentAnswer) : '—'}
                      </span>
                      {' · '}
                      Correct:{' '}
                      <span className="font-medium text-[hsl(var(--fg))]">
                        {formatAnswer(it.correctAnswer)}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )
      ) : null}

      {/* Integrity & Review tab */}
      {tab === 'integrity' ? (
        <div className="space-y-6">
          {/* Events */}
          <div>
            <div className="mb-2 text-sm font-semibold text-[hsl(var(--fg))]">
              Session integrity events
            </div>
            {eventsLoading ? (
              <div className="text-xs text-[hsl(var(--muted-fg))]">Loading events…</div>
            ) : !events || events.length === 0 ? (
              <div className="text-xs text-[hsl(var(--muted-fg))]">No integrity events recorded.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-left text-[hsl(var(--muted-fg))]">
                      <th className="px-3 py-2 font-medium">Event</th>
                      <th className="px-3 py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border)/0.5)]">
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td
                          className={cn(
                            'px-3 py-2 font-medium',
                            HIGH_SEVERITY.has(e.eventType)
                              ? 'text-[hsl(var(--danger))]'
                              : 'text-[hsl(var(--fg))]',
                          )}
                        >
                          {EVENT_LABELS[e.eventType] ?? e.eventType}
                        </td>
                        <td className="px-3 py-2 text-[hsl(var(--muted-fg))]">
                          {new Date(e.occurredAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Review controls */}
          {attemptId ? (
            <div className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="mb-3 text-sm font-semibold text-[hsl(var(--fg))]">
                Review status
              </div>

              <div className="flex flex-wrap gap-2">
                {(['VALID', 'FLAGGED', 'INVALIDATED'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReview((r) => ({ ...r, status: s }))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      review.status === s
                        ? s === 'INVALIDATED'
                          ? 'border-[hsl(var(--danger))] bg-[hsl(var(--danger))] text-white'
                          : s === 'FLAGGED'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {review.status === 'INVALIDATED' ? (
                <div className="mt-3 rounded-md bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-xs text-[hsl(var(--danger))]">
                  Invalidating will recompute this student&#39;s progression using only their remaining
                  valid attempts.
                </div>
              ) : null}

              <div className="mt-3">
                <textarea
                  className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm placeholder:text-[hsl(var(--muted-fg))] focus:outline-none"
                  rows={2}
                  maxLength={500}
                  placeholder="Optional note (visible to other teachers)…"
                  value={review.note}
                  onChange={(e) => setReview((r) => ({ ...r, note: e.target.value }))}
                />
              </div>

              {review.error ? (
                <div className="mt-2 text-xs text-[hsl(var(--danger))]">{review.error}</div>
              ) : null}

              <div className="mt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void saveReview()}
                  disabled={review.saving}
                >
                  {review.saving ? 'Saving…' : 'Save review'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
