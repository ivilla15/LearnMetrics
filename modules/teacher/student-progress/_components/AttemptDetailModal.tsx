'use client';

import * as React from 'react';
import { Modal, Button } from '@/components';
import { cn } from '@/lib';
import type { AttemptDetailForModal } from '@/types/attempts';

export function AttemptDetailModal({
  open,
  onClose,
  title = 'Attempt details',

  studentId,
  studentName,
  studentUsername,

  detail,
  loading,
  error,

  showIncorrectOnly,
  onToggleIncorrectOnly,
}: {
  open: boolean;
  onClose: () => void;

  title?: string;

  studentId?: number | null;
  studentName?: string | null;
  studentUsername?: string | null;

  detail: AttemptDetailForModal | null;
  loading: boolean;
  error: string | null;

  showIncorrectOnly: boolean;
  onToggleIncorrectOnly: (next: boolean) => void;
}) {
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
        typeof studentId === 'number' ? `• ID: ${studentId}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  const descriptionNode = (
    <div className="space-y-1">
      {studentLine ? (
        <div className="text-sm font-semibold text-[hsl(var(--fg))]">{studentLine}</div>
      ) : null}

      <div className="text-base font-semibold text-[hsl(var(--fg))]">{headerLine}</div>

      {detail ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">
          Completed: {new Date(detail.completedAt).toLocaleString()}
          <div className="mt-0.5">Level at time: {detail.levelAtTime}</div>
        </div>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={descriptionNode}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {loading ? (
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
                    'rounded-[var(--radius)] border p-3 border-l-4',
                    it.isCorrect
                      ? 'border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.12)] border-l-[hsl(var(--success))]'
                      : 'border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.12)] border-l-[hsl(var(--danger))]',
                  )}
                >
                  <div className="font-medium text-[hsl(var(--fg))]">{it.prompt}</div>

                  <div className="mt-1 text-[hsl(var(--muted-fg))]">
                    Your answer:{' '}
                    <span className="font-medium text-[hsl(var(--fg))]">
                      {it.studentAnswer === -1 ? '—' : it.studentAnswer}
                    </span>
                    {' · '}
                    Correct:{' '}
                    <span className="font-medium text-[hsl(var(--fg))]">{it.correctAnswer}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
