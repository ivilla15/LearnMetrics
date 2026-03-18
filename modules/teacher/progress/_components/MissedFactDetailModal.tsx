'use client';

import * as React from 'react';
import { Modal, Button, HelpText, MiniBar } from '@/components';
import type { FactDetailDTO, MissedFactDTO } from '@/types';

export function MissedFactDetailModal({
  open,
  onClose,
  selectedFact,
  loading,
  detail,
  rows,
  maxIncorrect,
  onGoStudent,
}: {
  open: boolean;
  onClose: () => void;
  selectedFact: MissedFactDTO | null;
  loading: boolean;
  detail: FactDetailDTO | null;
  rows: Array<{
    studentId: number;
    name: string;
    username: string;
    incorrectCount: number;
    totalCount: number;
  }>;
  maxIncorrect: number;
  onGoStudent: (studentId: number) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        selectedFact
          ? `Who missed ${selectedFact.operandA} × ${selectedFact.operandB}?`
          : 'Who missed this fact?'
      }
      description="Per-student counts for this fact within the selected range."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
      ) : !detail ? (
        <div className="text-sm text-[hsl(var(--muted-fg))]">
          No detail loaded. (Check API route / response.)
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[hsl(var(--muted-fg))]">
          No student misses recorded for this fact in the selected range.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Totals</div>
            <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
              Incorrect: {detail.totalIncorrect} • Attempts containing this fact:{' '}
              {detail.totalAttempts}
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <button
                key={r.studentId}
                type="button"
                onClick={() => onGoStudent(r.studentId)}
                className={[
                  'w-full text-left rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 transition-colors',
                  'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">{r.name}</div>
                    <div className="text-xs font-mono text-[hsl(var(--muted-fg))]">
                      {r.username}
                    </div>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                      Incorrect {r.incorrectCount}/{r.totalCount}
                    </div>
                  </div>

                  <div className="w-45">
                    <MiniBar value={r.incorrectCount} max={maxIncorrect} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <HelpText>Click a student to open their progress report.</HelpText>
        </div>
      )}
    </Modal>
  );
}
