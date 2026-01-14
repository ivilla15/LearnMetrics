import * as React from 'react';
import { cn } from '@/lib/utils';

type PageHeaderTone = 'default' | 'subtle';

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  tone?: PageHeaderTone;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, actions, tone = 'default', className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'w-full px-6 sm:px-8 pt-6 pb-4',
          'relative z-10',
          tone === 'default' && 'bg-[hsl(var(--bg))]',
          tone === 'subtle' && 'bg-[hsl(var(--section))]',
          'shadow-[2px_0_24px_rgba(0,0,0,0.08)]',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--fg))]">{title}</h1>

            {subtitle ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-fg))]">
                {subtitle}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
          ) : null}
        </div>
      </header>
    );
  },
);

PageHeader.displayName = 'PageHeader';

export { PageHeader };
