import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

type Props = {
  className?: string;
  rightSlot?: React.ReactNode;
  href?: string; // default "/"
  variant?: 'default' | 'surface';
};

export function PageTopBar({ className, rightSlot, href = '/', variant = 'default' }: Props) {
  const bg = variant === 'surface' ? 'bg-[hsl(var(--brand)/0.10)]' : 'bg-[hsl(var(--bg))]';

  return (
    <header className={cn('w-full border-b border-[hsl(var(--border))]', bg, className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href={href} className="flex items-center gap-2" aria-label="Go to home">
          <LearnMetricsLogo variant="full-blue" />
        </Link>

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
