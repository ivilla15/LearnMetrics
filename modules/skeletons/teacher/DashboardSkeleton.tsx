'use client';

import { Section, Card, CardHeader, CardContent, Skeleton } from '@/components';

export function DashboardSkeleton() {
  return (
    <Section>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-(--radius)" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-(--radius)" />
            ))}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
