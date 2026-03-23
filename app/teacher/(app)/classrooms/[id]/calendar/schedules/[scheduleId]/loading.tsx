import * as React from 'react';

import { PageHeader, Section, Card, CardContent, Skeleton } from '@/components';

export default function Loading() {
  return (
    <>
      <PageHeader title="Loading…" subtitle="Scheduled assignment details." />

      <Section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>

        <Card className="shadow-sm">
          <CardContent className="py-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Type</div>
                <Skeleton className="mt-1 h-6 w-32 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Target</div>
                <Skeleton className="mt-1 h-6 w-28 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Opens</div>
                <Skeleton className="mt-1 h-6 w-48 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Closes</div>
                <Skeleton className="mt-1 h-6 w-48 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">
                  Window minutes
                </div>
                <Skeleton className="mt-1 h-6 w-16 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Operation</div>
                <Skeleton className="mt-1 h-6 w-24 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Run date</div>
                <Skeleton className="mt-1 h-6 w-32 rounded-md" />
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Status</div>
                <Skeleton className="mt-1 h-6 w-36 rounded-md" />
              </div>
            </div>

            <div className="rounded-(--radius) border border-[hsl(var(--brand)/0.25)] bg-[hsl(var(--brand)/0.08)] p-3">
              <Skeleton className="h-5 w-96 max-w-full rounded-md" />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-10 w-32 rounded-(--radius)" />
              <Skeleton className="h-10 w-32 rounded-(--radius)" />
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
