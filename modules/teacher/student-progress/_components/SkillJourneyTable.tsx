'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components';
import type { AttemptRowDTO, OperationCode } from '@/types';
import { formatOperation } from '@/types';
import { trendFromLast3 } from '@/core/progress/utils';
import { getDomainLabel } from '@/core/domain';
import type { DomainCode } from '@/types/domain';

type OperationSummary = {
  // groupKey is DomainCode when domain is known, OperationCode otherwise
  groupKey: string;
  operation: OperationCode;
  currentLevel: number;
  masteryRate: number;
  attempts: number;
  trend: 'improving' | 'regressing' | 'flat' | 'need3';
};

function buildSummaries(attempts: AttemptRowDTO[]): OperationSummary[] {
  // Group by domain when available, fall back to operation code
  const byGroup = new Map<string, AttemptRowDTO[]>();

  for (const a of attempts) {
    const key = a.domain ?? a.operation;
    const existing = byGroup.get(key) ?? [];
    existing.push(a);
    byGroup.set(key, existing);
  }

  const summaries: OperationSummary[] = [];

  for (const [groupKey, groupAttempts] of byGroup.entries()) {
    const sorted = [...groupAttempts].sort(
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
      groupKey,
      operation: sorted[0].operation,
      currentLevel,
      masteryRate,
      attempts: sorted.length,
      trend,
    });
  }

  // Sort: domain groups first (contain '_'), then by operation order within group
  const OP_ORDER: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];
  summaries.sort((a, b) => {
    const aOp = OP_ORDER.indexOf(a.operation);
    const bOp = OP_ORDER.indexOf(b.operation);
    if (aOp !== bOp) return aOp - bOp;
    return a.groupKey.localeCompare(b.groupKey);
  });

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
  onSelectDomain,
}: {
  attempts: AttemptRowDTO[];
  onSelectDomain?: (domainOrOp: string) => void;
}) {
  const summaries = React.useMemo(() => buildSummaries(attempts), [attempts]);

  if (summaries.length === 0) return null;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Skill Journey</CardTitle>
        <CardDescription>
          Per-skill progress summary.{onSelectDomain ? ' Click a row to filter.' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
                <th className="py-3 pl-5 pr-3">Skill</th>
                <th className="py-3 px-3 text-center">Current Level</th>
                <th className="py-3 px-3 text-center">Mastery Rate</th>
                <th className="py-3 px-3 text-center">Attempts</th>
                <th className="py-3 pl-3 pr-5 text-right">Trend</th>
              </tr>
            </thead>

            <tbody>
              {summaries.map((s) => {
                const trend = TREND_DISPLAY[s.trend];
                const clickable = !!onSelectDomain;
                // Use domain label when the groupKey is a DomainCode (contains '_')
                const label = s.groupKey.includes('_')
                  ? getDomainLabel(s.groupKey as DomainCode)
                  : formatOperation(s.operation);
                return (
                  <tr
                    key={s.groupKey}
                    className={[
                      'border-b border-[hsl(var(--border))] last:border-b-0',
                      clickable
                        ? 'cursor-pointer hover:bg-[hsl(var(--surface-2))]'
                        : '',
                    ].join(' ')}
                    onClick={clickable ? () => onSelectDomain(s.groupKey) : undefined}
                  >
                    <td className="py-3 pl-5 pr-3">
                      <span className="font-semibold text-[hsl(var(--fg))]">
                        {label}
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
