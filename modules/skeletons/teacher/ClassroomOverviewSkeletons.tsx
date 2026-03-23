import * as React from 'react';
import { Skeleton } from '@/components';

export function StatTileSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        {/* Label is static - user knows what's loading */}
        <span className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">
          {label}
        </span>

        {/* The big value pulse */}
        <div className="py-1">
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* The helper text pulse */}
        <div className="mt-1">
          <Skeleton className="h-3 w-40 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export function ClassroomStatsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <StatTileSkeleton label="Students" />
      <StatTileSkeleton label="Active" />
      <StatTileSkeleton label="Needs setup" />
      <StatTileSkeleton label="Active schedules" />
      <StatTileSkeleton label="Next test" />
      <StatTileSkeleton label="Mastery rate (7 days)" />
    </div>
  );
}
