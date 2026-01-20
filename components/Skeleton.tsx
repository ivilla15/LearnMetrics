import * as React from 'react';
import { cn } from '@/lib/utils';

type SkeletonProps<T extends React.ElementType = 'span'> = {
  as?: T;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

export function Skeleton<T extends React.ElementType = 'span'>({
  as,
  className,
  ...props
}: SkeletonProps<T>) {
  const Tag = (as ?? 'span') as React.ElementType;

  return (
    <Tag
      className={cn(
        'animate-pulse rounded-[var(--radius)] bg-[hsl(var(--muted))] inline-block',
        className,
      )}
      {...props}
    />
  );
}
