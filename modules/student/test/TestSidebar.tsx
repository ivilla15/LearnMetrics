'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';

function msToClock(ms: number) {
  const safe = Math.max(0, ms);
  const s = Math.floor(safe / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

type Props = {
  title: string;
  description?: string;

  timeRemainingMs?: number;

  answeredCount: number;
  totalCount: number;

  submitting?: boolean;
  submitLabel?: string;
  onSubmit: () => void;

  questionButtons: React.ReactNode;
  footerHint?: string;
};

export function TestSidebar({
  title,
  description,
  timeRemainingMs,
  answeredCount,
  totalCount,
  submitting,
  submitLabel = 'Submit',
  onSubmit,
  questionButtons,
  footerHint,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-[hsl(var(--muted-fg))]">{description}</p> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4">
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Time remaining</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-[hsl(var(--fg))]">
              {typeof timeRemainingMs === 'number' ? msToClock(timeRemainingMs) : '—'}
            </div>
          </div>

          <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4">
            <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Progress</div>
            <div className="mt-1 text-sm font-semibold text-[hsl(var(--fg))]">
              Answered {answeredCount}/{totalCount}
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={!!submitting} onClick={onSubmit}>
            {submitting ? 'Submitting…' : submitLabel}
          </Button>
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-4 space-y-3">
          {questionButtons}
          {footerHint ? (
            <div className="text-xs text-[hsl(var(--muted-fg))]">{footerHint}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
