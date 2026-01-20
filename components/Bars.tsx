// components/ui/bars.tsx
import * as React from 'react';

export function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="h-2 w-full rounded-full bg-[hsl(var(--surface-2))] overflow-hidden">
      <div className="h-full bg-[hsl(var(--brand))]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 text-xs font-semibold text-[hsl(var(--muted-fg))]">{label}</div>
      <div className="flex-1">
        <MiniBar value={value} max={max} />
      </div>
      <div className="w-10 shrink-0 text-right text-sm font-semibold text-[hsl(var(--fg))]">
        {value}
      </div>
    </div>
  );
}
