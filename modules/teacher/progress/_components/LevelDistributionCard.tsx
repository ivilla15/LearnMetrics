'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';
import type { OperationCode } from '@/types';

const OP_CONFIG: Record<OperationCode, { label: string; short: string }> = {
  ADD: { label: 'Addition', short: 'ADD' },
  SUB: { label: 'Subtraction', short: 'SUB' },
  MUL: { label: 'Multiplication', short: 'MUL' },
  DIV: { label: 'Division', short: 'DIV' },
};

const ALL_OPS: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];

type ActiveStudent = { activeOperation: OperationCode; activeLevel: number };

function computeMedianLevel(buckets: Array<{ level: number; count: number }>): number | null {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (total === 0) return null;

  const sorted = [...buckets].sort((a, b) => a.level - b.level);
  const mid = total / 2;
  let running = 0;
  for (const b of sorted) {
    running += b.count;
    if (running >= mid) return b.level;
  }
  return null;
}

export function LevelDistributionCard({
  students,
  loading,
  maxLevel = 12,
}: {
  students: ActiveStudent[];
  loading?: boolean;
  maxLevel?: number;
}) {
  const [selectedOp, setSelectedOp] = React.useState<OperationCode | null>(null);

  // Which ops actually have students (to show only active filter buttons)
  const presentOps = React.useMemo(() => {
    const s = new Set<OperationCode>();
    for (const st of students) s.add(st.activeOperation);
    return s;
  }, [students]);

  const buckets = React.useMemo(() => {
    const relevant = selectedOp
      ? students.filter((s) => s.activeOperation === selectedOp)
      : students;
    const map = new Map<number, number>();
    for (const s of relevant) map.set(s.activeLevel, (map.get(s.activeLevel) ?? 0) + 1);
    return Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => ({
      level,
      count: map.get(level) ?? 0,
      label: `Lvl ${level}`,
    }));
  }, [students, selectedOp, maxLevel]);

  const medianLevel = React.useMemo(() => computeMedianLevel(buckets), [buckets]);

  const descLabel = selectedOp
    ? `Students currently active on ${OP_CONFIG[selectedOp].label}`
    : 'Students by current active level';

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle>Level Distribution</CardTitle>
        <CardDescription>
          {descLabel}.
          {medianLevel !== null ? (
            <> Median: <strong>Level {medianLevel}</strong>.</>
          ) : null}
        </CardDescription>

        {/* Operation filter — only show buttons for ops with students present */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedOp(null)}
            className={[
              'cursor-pointer rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
              selectedOp === null
                ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
            ].join(' ')}
          >
            All
          </button>
          {ALL_OPS.filter((op) => presentOps.has(op)).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setSelectedOp(op)}
              className={[
                'cursor-pointer rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
                selectedOp === op
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              {OP_CONFIG[op].short}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : students.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
        ) : (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--surface-2))' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                    background: 'hsl(var(--surface))',
                    fontSize: 13,
                  }}
                  formatter={(value) => [value ?? 0, 'Students']}
                />
                {medianLevel !== null ? (
                  <ReferenceLine
                    x={`Lvl ${medianLevel}`}
                    stroke="hsl(var(--brand))"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Median',
                      position: 'top',
                      fontSize: 11,
                      fill: 'hsl(var(--brand))',
                    }}
                  />
                ) : null}
                <Bar dataKey="count" fill="hsl(var(--brand))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
