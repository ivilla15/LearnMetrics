'use client';

import * as React from 'react';
import { Skeleton } from '@/components';
import { Pill } from '@/components';

type Props = {
  label: string;
  tone: 'danger' | 'warning';
  count: number;
  children: React.ReactNode;
};

export function NeedsAttentionCategory({ label, tone, count, children }: Props) {
  const [expanded, setExpanded] = React.useState(count > 0);

  // Sync expansion when count changes (e.g., initial render)
  React.useEffect(() => {
    setExpanded(count > 0);
  }, [count]);

  return (
    <div className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-[hsl(var(--surface-2))] transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[hsl(var(--fg))]">{label}</span>
          {Pill(String(count), tone)}
        </div>
        <span className="text-xs text-[hsl(var(--muted-fg))]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded ? (
        <div className="border-t border-[hsl(var(--border))] px-4 divide-y divide-[hsl(var(--border))]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function NeedsAttentionCategorySkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[hsl(var(--fg))]">{label}</span>
          <Skeleton className="h-4 w-6 rounded-full" />
        </div>
      </div>
      <div className="border-t border-[hsl(var(--border))] px-4 divide-y divide-[hsl(var(--border))]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
