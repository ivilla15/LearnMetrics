'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, BarRow } from '@/components';

export function LevelDistributionCard({
  buckets,
  maxBucket,
}: {
  buckets: Array<{ level: number; count: number }>;
  maxBucket: number;
}) {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Level Distribution</CardTitle>
        <CardDescription>Current student levels across the class.</CardDescription>
      </CardHeader>

      <CardContent>
        {buckets.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
        ) : (
          <div className="space-y-3">
            {buckets.map((b) => (
              <BarRow key={b.level} label={`Lvl ${b.level}`} value={b.count} max={maxBucket} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
