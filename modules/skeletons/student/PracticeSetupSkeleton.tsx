'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label, HelpText, Skeleton, Button } from '@/components';

const skeletonInputClass = cn(
  'h-11 w-full rounded-[var(--radius)]',
  'bg-[hsl(var(--surface))]',
  'shadow-[0_0_0_1px_hsl(var(--border))]',
  'px-3 flex items-center',
  'cursor-not-allowed opacity-60',
);

export function PracticeSetupSkeleton() {
  return (
    <div className="space-y-5">
      {/* Level Field */}
      <div className="grid gap-2">
        <Label>Level</Label>
        <div className={skeletonInputClass}>
          <Skeleton className="h-2 w-8" />
        </div>
        <HelpText>Default is your current level: 3.</HelpText>
      </div>

      {/* Questions Field */}
      <div className="grid gap-2">
        <Label>Questions</Label>
        <div className={skeletonInputClass}>
          <Skeleton className="h-2 w-8" />
        </div>
        <HelpText>Recommended: 20–30 questions. Max 13 for this level.</HelpText>
      </div>

      {/* Time Limit Field */}
      <div className="grid gap-2">
        <Label>Time limit</Label>
        <div className={skeletonInputClass}>
          <Skeleton className="h-2 w-32" />
        </div>
        <HelpText>Practice can be timed or untimed.</HelpText>
      </div>

      {/* Operations Field */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Operations</Label>
          <div className="flex gap-2">
            <span className="text-xs underline opacity-30">All</span>
            <span className="text-xs underline opacity-30">Clear</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>

        <div className="mt-2 flex gap-4">
          <label className="inline-flex items-center gap-2 opacity-50">
            {/* Checkbox Skeleton matching input shadow style */}
            <div className="h-4 w-4 rounded shadow-[0_0_0_1px_hsl(var(--border))] bg-[hsl(var(--surface))]" />
            <span className="text-sm">Include fractions</span>
          </label>

          <label className="inline-flex items-center gap-2 opacity-50">
            <div className="h-4 w-4 rounded shadow-[0_0_0_1px_hsl(var(--border))] bg-[hsl(var(--surface))]" />
            <span className="text-sm">Include decimals</span>
          </label>
        </div>

        <HelpText>
          By default practice focuses on multiplication. Choose other operations or include
          fractions/decimals for mixed practice.
        </HelpText>
      </div>

      {/* Action Button Skeleton */}
      <Button size="lg" disabled className="w-38 opacity-50">
        Start practice
      </Button>
    </div>
  );
}
