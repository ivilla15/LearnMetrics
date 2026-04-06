'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';

type DailyPoint = { date: string; attempts: number; masteryRate: number; avgPercent: number };

function formatDateTick(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MasteryTrendCard({
  daily,
  loading,
}: {
  daily: DailyPoint[];
  loading?: boolean;
}) {
  const hasData = daily.some((d) => d.attempts > 0);

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Mastery Trend</CardTitle>
        <CardDescription>
          Daily trends over the selected period.{' '}
          <span style={{ color: 'hsl(var(--brand))' }}>●</span> Mastery rate &nbsp;
          <span style={{ color: 'hsl(var(--success))' }}>●</span> Avg score
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : !hasData ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No attempts in this range yet.</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                    background: 'hsl(var(--surface))',
                    fontSize: 13,
                  }}
                  formatter={(value, name) => [
                    `${value ?? 0}%`,
                    name === 'masteryRate' ? 'Mastery Rate' : 'Avg Score',
                  ]}
                  labelFormatter={formatDateTick}
                />
                <Line
                  type="monotone"
                  dataKey="masteryRate"
                  stroke="hsl(var(--brand))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPercent"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
