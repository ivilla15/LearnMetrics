'use client';

import * as React from 'react';
import type {
  ClassroomProgressLastTestDTO,
  TeacherAssignmentListItemDTO,
  CalendarProjectionRowDTO,
} from '@/types';
import { RecentTestsCard, RecentTestsSkeleton } from './RecentTestsCard';
import { UpcomingAssignmentsCard, UpcomingAssignmentsSkeleton } from './UpcomingAssignmentsCard';

type Props = {
  recentTests: ClassroomProgressLastTestDTO[];
  upcomingAssignments: TeacherAssignmentListItemDTO[];
  projections: CalendarProjectionRowDTO[];
  classroomId: number;
};

export function ComingUpSection({
  recentTests,
  upcomingAssignments,
  projections,
  classroomId,
}: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Coming Up</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTestsCard tests={recentTests} classroomId={classroomId} />
        <UpcomingAssignmentsCard
          assignments={upcomingAssignments}
          projections={projections}
          classroomId={classroomId}
        />
      </div>
    </div>
  );
}

export function ComingUpSkeleton() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Coming Up</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTestsSkeleton />
        <UpcomingAssignmentsSkeleton />
      </div>
    </div>
  );
}
