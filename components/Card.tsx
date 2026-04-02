import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toneOverrides = {
  primary: 'bg-[hsl(var(--brand))] text-white',
  black: 'bg-black text-white',
  white: 'bg-white text-black',
} as const;

const cardVariants = cva(
  'rounded-[var(--radius)] bg-[hsl(var(--card))] text-[hsl(var(--card-fg))] transition',
  {
    variants: {
      variant: {
        elevated: 'shadow-[0_4px_10px_rgba(0,0,0,0.08)]',
        muted: 'bg-[hsl(var(--section))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]',
        outline: 'border shadow-none bg-transparent',
        flat: 'shadow-none',
      },

      tone: {
        default: '',
        primary: '',
        black: '',
        white: '',
      },
    },

    compoundVariants: [
      { variant: 'outline', tone: 'primary', className: 'border-[hsl(var(--brand))]' },
      { variant: 'outline', tone: 'black', className: 'border-black' },
      { variant: 'outline', tone: 'white', className: 'border-white' },
    ],

    defaultVariants: {
      variant: 'elevated',
      tone: 'default',
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, tone = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, tone }),
        tone && tone !== 'default' && toneOverrides[tone],
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-7 py-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-[19px] sm:text-[20px] font-semibold leading-[1.2] tracking-[-0.02em]',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'mt-2 text-[15px] sm:text-[16px] leading-[1.47] tracking-[-0.01em] text-[hsl(var(--muted-fg))]',
      className,
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-7 pb-6', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-7 py-5', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
