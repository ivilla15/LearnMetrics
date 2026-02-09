import * as React from 'react';
import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';

export default function Loading() {
  return (
    <>
      <PageHeader title="Schedules" subtitle="Loading schedules…" />

      <Section className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>

        <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-40" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-[18px]" />
              <Skeleton className="h-20 w-full rounded-[18px]" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>

          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full rounded-[18px]" />
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
