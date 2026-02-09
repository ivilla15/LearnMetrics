import * as React from 'react';
import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';

export default function Loading() {
  return (
    <>
      <PageHeader title="Assignments" subtitle="Loading assignments…" />

      <Section className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Recent assignments */}
        <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-24 w-full rounded-[18px]" />
              <Skeleton className="h-24 w-full rounded-[18px]" />
              <Skeleton className="h-24 w-full rounded-[18px]" />
            </div>
          </CardContent>
        </Card>

        {/* All assignments */}
        <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1 min-w-55">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-10 w-64" />
              </div>

              <div className="grid gap-1">
                <Skeleton className="h-4 w-14" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
              <div className="p-4 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
