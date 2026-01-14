import * as React from 'react';
import { Card, CardContent } from '@/components';
import { cn } from '@/lib';

type Align = 'left' | 'center' | 'right';

export type StatTileProps = {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;

  /** visual tweaks */
  align?: Align;
  tone?: 'default' | 'brand' | 'danger' | 'success' | 'warning';
  className?: string;
};

function alignClass(align: Align) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function toneValueClass(tone: NonNullable<StatTileProps['tone']>) {
  switch (tone) {
    case 'brand':
      return 'text-[hsl(var(--brand))]';
    case 'danger':
      return 'text-[hsl(var(--danger))]';
    case 'success':
      return 'text-[hsl(var(--success))]';
    case 'warning':
      return 'text-[hsl(var(--warning))]';
    default:
      return 'text-[hsl(var(--fg))]';
  }
}

export function StatTile({
  label,
  value,
  helper,
  align = 'left',
  tone = 'default',
  className,
}: StatTileProps) {
  return (
    <Card
      className={cn('rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]', className)}
    >
      <CardContent className={cn('p-6', alignClass(align))}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
          {label}
        </div>

        <div className={cn('mt-2 text-3xl font-semibold tracking-tight', toneValueClass(tone))}>
          {value}
        </div>

        {helper ? (
          <div className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-fg))]">{helper}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
