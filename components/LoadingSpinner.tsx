import * as React from 'react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({
  label = 'Loading…',
  className,
  spinnerClassName,
}: {
  label?: string;
  className?: string;
  spinnerClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-[hsl(var(--muted-fg))]', className)}>
      <span
        aria-hidden
        className={cn(
          'h-4 w-4 animate-spin rounded-full border-2',
          'border-[hsl(var(--border))] border-t-[hsl(var(--fg))]',
          spinnerClassName,
        )}
      />
      <span>{label}</span>
    </div>
  );
}
