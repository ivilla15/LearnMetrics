import * as React from 'react';
import { cn } from '@/lib/utils';

type StatBoxTone = 'default' | 'success' | 'danger' | 'muted';
type StatBoxAlign = 'left' | 'center' | 'right';

type StatBoxProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: StatBoxTone;
  align?: StatBoxAlign;
};

export function StatBox({
  tone = 'default',
  align = 'left',
  className,
  children,
  ...props
}: StatBoxProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border',
        'px-4 py-1', // ✅ better padding
        'text-left',

        // alignment
        align === 'left' && 'text-left items-start',
        align === 'center' && 'text-center items-center',
        align === 'right' && 'text-right items-end',

        // color tones
        tone === 'default' && 'border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]',
        tone === 'muted' && 'border-[hsl(var(--border))] bg-[hsl(var(--surface-3))]',
        tone === 'success' && 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.08)]',
        tone === 'danger' && 'border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.08)]',

        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
