import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hoverBrandSoft = 'hover:bg-[hsl(var(--brand)/0.10)]';
const hoverBrandSoftBorder = 'hover:border-[hsl(var(--brand)/0.35)]';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
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

        // --- NEW OUTLINE VARIANT ---
        outline: [
          'bg-transparent text-[hsl(var(--brand))]',
          'border border-[hsl(var(--brand)/0.40)]', // Subtle border by default
          hoverBrandSoft, // Matches your hover variable
          hoverBrandSoftBorder, // Darkens border on hover
        ].join(' '),
        // ---------------------------

        secondary: [
          'bg-[hsl(var(--surface))] text-[hsl(var(--fg))]',
          'border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]',
          hoverBrandSoft,
          hoverBrandSoftBorder,
        ].join(' '),

        ghost: ['text-[hsl(var(--fg))]', hoverBrandSoft].join(' '),

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
