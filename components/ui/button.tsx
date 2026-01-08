import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-[0.5px]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[hsl(var(--brand))] text-white',
          'border border-[hsl(var(--brand))]',
          'hover:bg-[hsl(var(--brand)/0.92)]',
        ].join(' '),
        secondary: [
          'bg-[hsl(var(--surface))] text-[hsl(var(--fg))]',
          'border border-[hsl(var(--border))]',
          'hover:bg-[hsl(var(--muted))]',
        ].join(' '),
        ghost: ['text-[hsl(var(--fg))]', 'hover:bg-[hsl(var(--muted))]'].join(' '),
        destructive: [
          'bg-[hsl(var(--danger))] text-white',
          'border border-[hsl(var(--danger))]',
          'hover:bg-[hsl(var(--danger)/0.92)]',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-[var(--radius)]',
        md: 'h-10 px-4 text-sm rounded-[var(--radius)]',
        lg: 'h-12 px-6 text-base rounded-[var(--radius)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
