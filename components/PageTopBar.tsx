import * as React from 'react';
import { cn } from '@/lib';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

type Props = {
  className?: string;
  rightSlot?: React.ReactNode;
  href?: string;
  variant?: 'default' | 'surface';
};

export function PageTopBar({ className, rightSlot, href = '/', variant = 'default' }: Props) {
  const bg = variant === 'surface' ? 'bg-[hsl(var(--brand)/0.10)]' : 'bg-[hsl(var(--bg))]';

  return (
    <header className={cn('w-full border-b border-[hsl(var(--border))]', bg, className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <LearnMetricsLogo variant="full-blue" href={href} />

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
