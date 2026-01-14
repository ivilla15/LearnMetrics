import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-[var(--radius)]',
          'bg-[hsl(var(--surface))]',
          'shadow-[0_0_0_1px_hsl(var(--border))]',
          'px-3 text-sm text-[hsl(var(--fg))]',
          'placeholder:text-[hsl(var(--muted-fg))]',
          'outline-none',
          'focus:shadow-[0_0_0_2px_hsl(var(--ring))]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
