'use client';

import * as React from 'react';
import { Card, CardContent, Button, Pill } from '@/components';
import type { ScheduleGate } from '@/types';

export function GateBanner({ gate }: { gate: ScheduleGate }) {
  if (gate.ok) return null;

  return (
    <Card className="rounded-[28px] border border-[hsl(var(--brand)/0.22)] bg-[hsl(var(--brand)/0.10)] shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {Pill('Upgrade required', 'warning')}
              <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                Scheduling is locked
              </div>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--muted-fg))]">{gate.message}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button href={gate.upgradeHref} variant="primary" size="sm">
              Upgrade
            </Button>
            <Button href="/#pricing" variant="secondary" size="sm">
              View plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
