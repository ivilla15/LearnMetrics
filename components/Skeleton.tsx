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
      className={cn('animate-pulse rounded-md bg-[hsl(var(--surface-2))] inline-block', className)}
      {...props}
    />
  );
}
