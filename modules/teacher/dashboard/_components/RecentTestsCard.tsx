'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@/components';
import type { ClassroomProgressLastTestDTO } from '@/types';
import { formatLocal } from '@/lib/date';

type Props = {
  tests: ClassroomProgressLastTestDTO[];
  classroomId: number;
};

export function RecentTestsCard({ tests, classroomId }: Props) {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tests.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-fg))]">No tests have been completed yet.</p>
        ) : (
          tests.map((t) => (
            <Link
              key={t.assignmentId}
              href={`/teacher/classrooms/${classroomId}/assignments/${t.assignmentId}`}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2 hover:bg-[hsl(var(--border))] transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{t.mode}</Badge>
                  <span className="text-xs text-[hsl(var(--muted-fg))]">
                    {formatLocal(t.opensAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm font-semibold text-[hsl(var(--fg))]">
                    {t.masteryRate}%
                    <span className="text-xs font-normal text-[hsl(var(--muted-fg))] ml-1">
                      mastery
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-[hsl(var(--fg))]">
                    {t.attemptedCount}
                    <span className="text-xs font-normal text-[hsl(var(--muted-fg))] ml-1">
                      attempted
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-xs text-[hsl(var(--muted-fg))]">→</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function RecentTestsSkeleton() {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2"
          >
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
