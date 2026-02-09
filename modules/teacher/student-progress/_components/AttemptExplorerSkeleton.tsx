'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, Skeleton } from '@/components';

export function AttemptExplorerSkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-72" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-52" />
            </div>
            <Skeleton className="h-10 w-44 rounded-(--radius)" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </>
  );
}
