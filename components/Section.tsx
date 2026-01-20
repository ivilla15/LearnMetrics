import * as React from 'react';
import { cn } from '@/lib/utils';

type SectionTone = 'none' | 'subtle' | 'default';
type SectionPad = 'none' | 'sm' | 'md' | 'lg';

export function Section({
  tone = 'none',
  pad = 'md',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { tone?: SectionTone; pad?: SectionPad }) {
  return (
    <section
      className={cn(
        'w-full',
        tone === 'default' && 'bg-[hsl(var(--bg))]',
        tone === 'subtle' && 'bg-[hsl(var(--section))]',
        pad === 'sm' && 'py-6 sm:py-8',
        pad === 'md' && 'py-8 sm:py-10',
        pad === 'lg' && 'py-10 sm:py-12',
        pad === 'none' && 'py-0',
        className,
      )}
      {...props}
    >
      <div className="px-6 sm:px-8">{children}</div>
    </section>
  );
}
