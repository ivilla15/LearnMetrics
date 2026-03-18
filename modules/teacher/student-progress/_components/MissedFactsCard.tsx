'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, MiniBar } from '@/components';
import { MissedFactDTO } from '@/types';

export function MissedFactsCard(props: { missedFacts: MissedFactDTO[] }) {
  const { missedFacts } = props;

  const maxIncorrect = React.useMemo(
    () => missedFacts.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0),
    [missedFacts],
  );

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Most Missed Facts</CardTitle>
        <CardDescription>Facts this student missed most within the selected range.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {missedFacts.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No missed facts in this range.</div>
        ) : (
          missedFacts.map((m) => (
            <div
              key={`${m.operation}:${m.operandA}:${m.operandB}`}
              className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                    {m.operandA} × {m.operandB} = {m.correctAnswer}
                  </div>
                  <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                    Incorrect {m.incorrectCount}/{m.totalCount} ({m.errorRate}% error)
                  </div>
                </div>

                <div className="sm:w-45 w-full">
                  <MiniBar value={m.incorrectCount} max={maxIncorrect} />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
