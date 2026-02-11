'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';

export function LogoutCard({
  title = 'Logging out…',
  description = 'One moment.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="w-full max-w-md rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-5/6" />
      </CardContent>
    </Card>
  );
}
