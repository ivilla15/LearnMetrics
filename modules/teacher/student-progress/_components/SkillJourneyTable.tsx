'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components';
import type { AttemptRowDTO, OperationCode } from '@/types';
import { OPERATION_SYMBOL } from '@/types';
import { trendFromLast3 } from '@/core/progress/utils';

type OperationSummary = {
  operation: OperationCode;
  currentLevel: number;
  masteryRate: number;
  attempts: number;
  trend: 'improving' | 'regressing' | 'flat' | 'need3';
};

function buildSummaries(attempts: AttemptRowDTO[]): OperationSummary[] {
  const byOp = new Map<OperationCode, AttemptRowDTO[]>();

  for (const a of attempts) {
    const existing = byOp.get(a.operation) ?? [];
    existing.push(a);
    byOp.set(a.operation, existing);
  }

  const summaries: OperationSummary[] = [];

  for (const [operation, opAttempts] of byOp.entries()) {
    const sorted = [...opAttempts].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    );

    const mastered = sorted.filter((a) => a.wasMastery).length;
    const masteryRate = sorted.length > 0 ? Math.round((mastered / sorted.length) * 100) : 0;

    // Current level: latest levelAtTime, +1 if the last attempt was mastery
    const latest = sorted[sorted.length - 1];
    const currentLevel = latest.wasMastery
      ? Math.min(latest.levelAtTime + 1, 12)
      : latest.levelAtTime;

    // Trend: last 3 percents, oldest→newest
    const last3 = sorted.slice(-3).map((a) => a.percent);
    const trend = trendFromLast3(last3);

    summaries.push({
      operation,
      currentLevel,
      masteryRate,
      attempts: sorted.length,
      trend,
    });
  }

  // Sort by operation code order
  const ORDER: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];
  summaries.sort((a, b) => ORDER.indexOf(a.operation) - ORDER.indexOf(b.operation));

  return summaries;
}

const TREND_DISPLAY: Record<OperationSummary['trend'], { icon: string; label: string; tone: 'success' | 'muted' | 'danger' }> = {
  improving: { icon: '↑', label: 'Improving', tone: 'success' },
  regressing: { icon: '↓', label: 'Regressing', tone: 'danger' },
  flat: { icon: '→', label: 'Steady', tone: 'muted' },
  need3: { icon: '—', label: 'Need 3', tone: 'muted' },
};

export function SkillJourneyTable({
  attempts,
  onSelectOperation,
}: {
  attempts: AttemptRowDTO[];
  onSelectOperation?: (op: OperationCode) => void;
}) {
  const summaries = React.useMemo(() => buildSummaries(attempts), [attempts]);

  if (summaries.length === 0) return null;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Skill Journey</CardTitle>
        <CardDescription>
          Per-operation progress summary.{onSelectOperation ? ' Click a row to filter by operation.' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
                <th className="py-3 pl-5 pr-3">Operation</th>
                <th className="py-3 px-3 text-center">Current Level</th>
                <th className="py-3 px-3 text-center">Mastery Rate</th>
                <th className="py-3 px-3 text-center">Attempts</th>
                <th className="py-3 pl-3 pr-5 text-right">Trend</th>
              </tr>
            </thead>

            <tbody>
              {summaries.map((s) => {
                const trend = TREND_DISPLAY[s.trend];
                const clickable = !!onSelectOperation;
                return (
                  <tr
                    key={s.operation}
                    className={[
                      'border-b border-[hsl(var(--border))] last:border-b-0',
                      clickable
                        ? 'cursor-pointer hover:bg-[hsl(var(--surface-2))]'
                        : '',
                    ].join(' ')}
                    onClick={clickable ? () => onSelectOperation(s.operation) : undefined}
                  >
                    <td className="py-3 pl-5 pr-3">
                      <span className="font-semibold text-[hsl(var(--fg))]">
                        {OPERATION_SYMBOL[s.operation]} {s.operation}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-medium">
                      {s.currentLevel}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={[
                          'font-medium',
                          s.masteryRate >= 85
                            ? 'text-[hsl(var(--success))]'
                            : s.masteryRate >= 70
                              ? 'text-[hsl(var(--warning))]'
                              : 'text-[hsl(var(--danger))]',
                        ].join(' ')}
                      >
                        {s.masteryRate}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center text-[hsl(var(--muted-fg))]">
                      {s.attempts}
                    </td>

                    <td className="py-3 pl-3 pr-5 text-right">
                      <Badge tone={trend.tone}>
                        {trend.icon} {trend.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
