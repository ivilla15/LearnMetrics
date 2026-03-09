import * as React from 'react';

import { Card, Skeleton } from '@/components';

type Props = {
  className?: string;
};

export function AssignmentRowLoadingCard({ className }: Props) {
  return (
    <Card
      variant="elevated"
      tone="primary"
      className={['transition', className].filter(Boolean).join(' ')}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>

          <Skeleton className="mt-2 h-4 w-44" />
          <Skeleton className="mt-2 h-3 w-60" />
        </div>

        {/* Right */}
        <div className="shrink-0 text-right">
          <Skeleton className="h-4 w-10 ml-auto" />
          <Skeleton className="mt-2 h-3 w-16 ml-auto" />
        </div>
      </div>
    </Card>
  );
}
