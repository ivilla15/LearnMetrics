'use client';

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
        {/* Left Side: Title & Meta Info */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Top Row: Title + Pills */}
          <div className="flex flex-wrap items-center gap-5">
            <Skeleton as="div" className="h-2 w-32" /> {/* Title */}
            <Skeleton as="div" className="h-2 w-16 rounded-full" /> {/* Pill */}
            <Skeleton as="div" className="h-2 w-12" /> {/* Status Text */}
          </div>

          {/* Bottom Row: Mode & Time Window */}
          <div className="space-y-2">
            <Skeleton as="div" className="h-2 w-48" /> {/* Mode · Operation */}
            <Skeleton as="div" className="h-2 w-64" /> {/* Opens · Closes */}
          </div>
        </div>

        {/* Right Side: Score & Duration */}
        <div className="shrink-0 flex flex-col items-end space-y-3">
          <Skeleton as="div" className="h-2 w-10" /> {/* Score % */}
          <Skeleton as="div" className="h-2 w-14" /> {/* Duration min */}
        </div>
      </div>
    </Card>
  );
}
