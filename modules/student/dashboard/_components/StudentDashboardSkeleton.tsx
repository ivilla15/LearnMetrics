import * as React from 'react';

import { Section, Card, CardHeader, Skeleton } from '@/components';
import { AssignmentRowLoadingCard } from './AssignmentRowLoadingCard';

function DayHeaderSkeleton(props: { withSubtitle?: boolean }) {
  const { withSubtitle = false } = props;

  return (
    <div className="px-1">
      <Skeleton className="h-4 w-28" />
      {withSubtitle ? <Skeleton className="mt-2 h-4 w-40" /> : null}
    </div>
  );
}

function NothingPlannedSkeleton() {
  return (
    <Card variant="elevated" tone="primary">
      <CardHeader>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
    </Card>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <>
      <Section>
        {/* Reserve space so the timeline swap causes minimal layout shift */}
        <div className="min-h-140 space-y-6">
          {/* Yesterday */}
          <div className="space-y-3">
            <DayHeaderSkeleton />
            <div className="space-y-3">
              <AssignmentRowLoadingCard />
              <AssignmentRowLoadingCard />
            </div>
          </div>

          {/* Today (has subtitle date in your timeline) */}
          <div className="space-y-3">
            <DayHeaderSkeleton withSubtitle />
            <div className="space-y-3">
              <AssignmentRowLoadingCard />
              <AssignmentRowLoadingCard />
              <AssignmentRowLoadingCard />
            </div>
          </div>

          {/* Tomorrow */}
          <div className="space-y-3">
            <DayHeaderSkeleton />
            <div className="space-y-3">
              {/* Sometimes there may be nothing planned, so show the empty state style too */}
              <NothingPlannedSkeleton />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
