import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))] disabled:pointer-events-none disabled:opacity-50 active:translate-y-[0.5px]',
  {
    variants: {
      variant: {
        primary:
          'bg-[hsl(var(--brand))] text-white border border-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.92)]',
        outline:
          'border border-white/20 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/35',
        secondary:
          'bg-[hsl(var(--surface))] text-[hsl(var(--fg))] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] hover:bg-[hsl(var(--brand)/0.10)]',
        ghost: 'text-[hsl(var(--fg))] hover:bg-[hsl(var(--brand)/0.10)]',
        destructive:
          'bg-[hsl(var(--danger))] text-white border border-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.92)]',
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

// --- TYPE-SAFE PROPS ---
type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  alt?: string;
};

type AsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsAnchor = ButtonBaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = AsButton | AsAnchor;

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const { className, variant, size, ...rest } = props;
    const classes = cn(buttonVariants({ variant, size, className }));

    if (rest.href !== undefined) {
      const { href, ...anchorProps } = rest as AsAnchor;
      return (
        <Link
          {...anchorProps}
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
        />
      );
    }

    // TypeScript now knows 'rest' is ButtonHTMLAttributes
    const { type = 'button', ...buttonProps } = rest as AsButton;
    return (
      <button
        {...buttonProps}
        type={type}
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
