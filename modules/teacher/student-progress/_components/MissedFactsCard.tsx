'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, MiniBar } from '@/components';
import type { MissedFactDTO } from '@/types';
import { OPERATION_SYMBOL } from '@/types';

function formatFact(m: MissedFactDTO): string {
  const sym = OPERATION_SYMBOL[m.operation] ?? '?';
  return `${m.operandA} ${sym} ${m.operandB} = ${m.correctAnswer}`;
}

function formatErrorText(m: MissedFactDTO): string {
  return `Missed ${m.incorrectCount} of ${m.totalCount} times — ${m.errorRate}% error rate`;
}

export function MissedFactsCard(props: { missedFacts: MissedFactDTO[] }) {
  const { missedFacts } = props;

  const maxIncorrect = React.useMemo(
    () => missedFacts.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0),
    [missedFacts],
  );

  const top5 = missedFacts.slice(0, 5);

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Most Missed Facts</CardTitle>
        <CardDescription>Facts this student missed most within the selected range.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {top5.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No missed facts in this range.</div>
        ) : (
          top5.map((m) => (
            <div
              key={`${m.operation}:${m.operandA}:${m.operandB}`}
              className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                    {formatFact(m)}
                  </div>
                  <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                    {formatErrorText(m)}
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
