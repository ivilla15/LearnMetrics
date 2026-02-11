import * as React from 'react';
import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';

export default function Loading() {
  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Print cards" subtitle="Loading setup cards…" />
        <Section className="space-y-4">
          <Skeleton className="h-10 w-full rounded-[999px]" />
        </Section>
      </div>

      <Section>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 print:hidden">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-10 w-24 rounded-[999px]" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)] print:shadow-none"
              >
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-40" />
                  </div>

                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-48" />
                  </div>

                  <div className="space-y-1">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-7 w-56" />
                  </div>

                  <Skeleton className="h-3 w-72 max-w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
