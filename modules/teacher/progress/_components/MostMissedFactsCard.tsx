'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  MiniBar,
} from '@/components';
import type { MissedFactDTO } from '@/types';

export function MostMissedFactsCard({
  top3,
  restCount,
  maxIncorrect,
  onOpenAll,
  onOpenFact,
}: {
  top3: MissedFactDTO[];
  restCount: number;
  maxIncorrect: number;
  onOpenAll: () => void;
  onOpenFact: (fact: MissedFactDTO) => void;
}) {
  if (top3.length === 0) return null;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Most Missed Facts</CardTitle>
          <CardDescription>Based on incorrect AttemptItems in the selected range.</CardDescription>
        </div>

        {restCount > 0 ? (
          <Button variant="secondary" onClick={onOpenAll}>
            View all
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {top3.map((m) => (
          <button
            key={`${m.operation}:${m.operandA}x${m.operandB}`}
            type="button"
            onClick={() => onOpenFact(m)}
            className={[
              'w-full text-left rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 transition-colors',
              'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                  {m.operandA} × {m.operandB} = {m.correctAnswer}
                </div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                  Incorrect {m.incorrectCount}/{m.totalCount} ({m.errorRate}% error)
                </div>
                <div className="mt-2 text-[11px] text-[hsl(var(--muted-fg))]">
                  Click to see which students missed this.
                </div>
              </div>

              <div className="w-45">
                <MiniBar value={m.incorrectCount} max={maxIncorrect} />
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
