import * as React from 'react';

import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';

export default function Loading() {
  return (
    <>
      <PageHeader title="People" subtitle="Loading roster…" />

      <Section className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>

        <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
            </div>

            <div className="overflow-hidden rounded-[28px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
              <div className="p-4 space-y-3">
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
