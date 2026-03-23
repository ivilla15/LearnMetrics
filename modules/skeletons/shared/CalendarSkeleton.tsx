'use client';

import * as React from 'react';
import {
  PageHeader,
  Section,
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Button,
  CardDescription,
  CardTitle,
} from '@/components';

type Props = {
  showSubNav?: boolean;
  subtitle?: string;
};

export function CalendarSkeleton(props: Props) {
  const { showSubNav = false, subtitle = 'Loading assignments…' } = props;

  const calendarCard = (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              <Skeleton className="h-5 w-20" />
            </CardTitle>
            <CardDescription>Click an item to view details.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" loading>
              Prev
            </Button>
            <Button variant="secondary" loading>
              Today
            </Button>
            <Button variant="secondary" loading>
              Next
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weekday labels */}
        <div className="hidden md:grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-27.5 rounded-[18px] bg-[hsl(var(--surface))] p-2 shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-3 w-10" />
              </div>

              <div className="mt-3 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-[18px]" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (showSubNav) {
    return (
      <>
        <PageHeader title="Calendar" subtitle={subtitle} />
        <Section className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
          {calendarCard}
        </Section>
      </>
    );
  }
  return <>{calendarCard}</>;
}
