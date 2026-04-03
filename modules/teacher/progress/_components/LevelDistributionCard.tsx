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
  buckets,
  loading,
}: {
  buckets: Array<{ level: number; count: number }>;
  loading?: boolean;
}) {
  const medianLevel = React.useMemo(() => computeMedianLevel(buckets), [buckets]);

  const chartData = React.useMemo(
    () => buckets.map((b) => ({ ...b, label: `Lvl ${b.level}` })),
    [buckets],
  );

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Level Distribution</CardTitle>
        <CardDescription>
          Students per level.
          {medianLevel !== null ? (
            <> Median: <strong>Level {medianLevel}</strong>.</>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : buckets.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
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
