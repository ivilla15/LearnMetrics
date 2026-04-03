'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';

const BUCKET_COLOR: Record<string, string> = {
  '0-49': 'hsl(var(--danger))',
  '50-69': 'hsl(var(--warning))',
  '70-84': 'hsl(var(--muted-fg))',
  '85-99': 'hsl(var(--success))',
  '100': 'hsl(var(--brand))',
};

export function ScoreDistributionCard({
  buckets,
  loading,
}: {
  buckets: Array<{ label: string; count: number }>;
  loading?: boolean;
}) {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Score Distribution</CardTitle>
        <CardDescription>Attempt counts by score range in the selected period.</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : buckets.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No attempts in this range yet.</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
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
                  formatter={(value) => [value ?? 0, 'Attempts']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {buckets.map((b) => (
                    <Cell
                      key={b.label}
                      fill={BUCKET_COLOR[b.label] ?? 'hsl(var(--brand))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
