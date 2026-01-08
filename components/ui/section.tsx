import * as React from 'react';
import { cn } from '@/lib/utils';

type SectionTone = 'none' | 'subtle' | 'default';

export function Section({
  tone = 'none',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { tone?: SectionTone }) {
  return (
    <section
      className={cn(
        'w-full py-10 sm:py-12',
        tone === 'default' && 'bg-[hsl(var(--bg))]',
        tone === 'subtle' && 'bg-[hsl(var(--section))]',
        className,
      )}
      {...props}
    >
      <div className="px-6 sm:px-8">{children}</div>
    </section>
  );
}
