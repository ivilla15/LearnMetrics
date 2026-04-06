'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components';
import type { MissedFactDTO } from '@/types';
import { OPERATION_SYMBOL } from '@/types';

function formatFact(m: MissedFactDTO): string {
  const sym = OPERATION_SYMBOL[m.operation] ?? '?';
  return `${m.operandA} ${sym} ${m.operandB} = ${m.correctAnswer}`;
}

type Props = {
  facts: MissedFactDTO[];
  classroomId: number;
};

export function TopMissedFactsCard({ facts, classroomId }: Props) {
  const top3 = facts.slice(0, 3);

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Top Missed Facts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {top3.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-fg))]">No missed facts this week.</p>
        ) : (
          <>
            {top3.map((m) => (
              <div
                key={`${m.operation}:${m.operandA}x${m.operandB}`}
                className="flex items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                    {formatFact(m)}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">
                    {m.errorRate}% error rate
                  </div>
                </div>
                <span className="text-lg font-bold text-[hsl(var(--muted-fg))]">
                  {OPERATION_SYMBOL[m.operation]}
                </span>
              </div>
            ))}
            <div className="pt-1">
              <Link
                href={`/teacher/classrooms/${classroomId}/progress`}
                className="text-xs font-medium text-[hsl(var(--brand))] hover:underline"
              >
                See all missed facts →
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function TopMissedFactsSkeleton() {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Top Missed Facts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2"
          >
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
