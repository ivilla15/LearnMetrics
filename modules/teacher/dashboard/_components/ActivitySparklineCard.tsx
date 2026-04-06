'use client';

import * as React from 'react';
import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components';

type DailyPoint = {
  date: string;
  attempts: number;
  masteryRate: number;
  avgPercent: number;
};

type Props = {
  daily: DailyPoint[];
  summaryText: string;
};

export function ActivitySparklineCard({ daily, summaryText }: Props) {
  const last7 = daily.slice(-7);
  const hasData = last7.some((d) => d.attempts > 0);

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity This Week</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-sm text-[hsl(var(--muted-fg))]">No activity this week yet.</p>
          </div>
        ) : (
          <>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={last7} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <YAxis
                    yAxisId="mastery"
                    domain={[0, 100]}
                    hide
                  />
                  <YAxis
                    yAxisId="attempts"
                    orientation="right"
                    hide
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                      background: 'hsl(var(--surface))',
                      fontSize: 12,
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [
                      name === 'masteryRate' ? `${value ?? 0}%` : (value ?? 0),
                      name === 'masteryRate' ? 'Mastery' : 'Attempts',
                    ]}
                    labelFormatter={(label: string) => {
                      const d = new Date(label);
                      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    }}
                  />
                  <Line
                    yAxisId="mastery"
                    type="monotone"
                    dataKey="masteryRate"
                    stroke="hsl(var(--brand))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="attempts"
                    type="monotone"
                    dataKey="attempts"
                    stroke="hsl(var(--muted-fg))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    strokeOpacity={0.6}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {summaryText ? (
              <p className="mt-2 text-xs text-[hsl(var(--muted-fg))]">{summaryText}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivitySparklineSkeleton() {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[180px] w-full rounded-[14px]" />
      </CardContent>
    </Card>
  );
}
