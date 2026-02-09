import * as React from 'react';
import { cn } from '@/lib/utils';

export function StatsGrid({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
  );
}
