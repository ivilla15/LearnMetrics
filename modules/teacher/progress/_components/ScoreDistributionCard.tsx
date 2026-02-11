'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, BarRow } from '@/components';

export function ScoreDistributionCard({
  buckets,
  maxBucket,
}: {
  buckets: Array<{ label: string; count: number }>;
  maxBucket: number;
}) {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Score Distribution</CardTitle>
        <CardDescription>Current student percentages across the class last test</CardDescription>
      </CardHeader>

      <CardContent>
        {buckets.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No attempts in this range yet.</div>
        ) : (
          <div className="space-y-3">
            {buckets.map((b) => (
              <BarRow key={b.label} label={b.label} value={b.count} max={maxBucket} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
