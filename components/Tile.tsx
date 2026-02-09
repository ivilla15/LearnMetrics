import * as React from 'react';
import { Card, CardContent } from '@/components';
import { cn } from '@/lib';

type Align = 'left' | 'center' | 'right';
type Tone = 'default' | 'brand' | 'danger' | 'success' | 'warning';

export type TitledCardProps = {
  title?: string;
  children: React.ReactNode;

  align?: Align;
  tone?: Tone;
  className?: string;

  subtitle?: React.ReactNode;
};

function alignClass(align: Align) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function toneTitleClass(tone: Tone) {
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

export function Tile({
  title,
  subtitle,
  children,
  align = 'left',
  tone = 'default',
  className,
}: TitledCardProps) {
  return (
    <Card className={cn('rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]', className)}>
      <CardContent className={cn(alignClass(align))}>
        {title ? (
          <div
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              toneTitleClass(tone),
            )}
          >
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">{subtitle}</div>
        ) : null}
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}
