'use client';

import * as React from 'react';
import type { ClassroomProgressDTO } from '@/types';
import { LevelDistributionCard } from '@/modules/teacher/progress/_components/LevelDistributionCard';
import { OperationDistributionCard } from '@/modules/teacher/progress/_components/OperationDistributionCard';
import { Skeleton } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components';
import { TopMissedFactsCard, TopMissedFactsSkeleton } from './TopMissedFactsCard';

type Props = {
  students: ClassroomProgressDTO['students'];
  topMissedFacts: ClassroomProgressDTO['insights']['topMissedFacts'];
  classroomId: number;
};

export function WeeklySnapshotSection({ students, topMissedFacts, classroomId }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">This Week</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <LevelDistributionCard students={students} />
        <OperationDistributionCard students={students} />
        <TopMissedFactsCard facts={topMissedFacts} classroomId={classroomId} />
      </div>
    </div>
  );
}

export function WeeklySnapshotSkeleton() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">This Week</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {['Level Distribution', 'Operation Distribution'].map((label) => (
          <Card
            key={label}
            className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0"
          >
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-52 w-full rounded-[14px]" />
            </CardContent>
          </Card>
        ))}
        <TopMissedFactsSkeleton />
      </div>
    </div>
  );
}
