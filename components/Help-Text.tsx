import * as React from 'react';
import { cn } from '@/lib/utils';

export function HelpText({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-[13px] leading-[1.45] text-[hsl(var(--muted-fg))]', className)}
      {...props}
    />
  );
}
