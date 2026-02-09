'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Pill,
  Skeleton,
} from '@/components';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

type Props = {
  pillText: string; // "Teacher portal" | "Student portal"
  title: string; // "Logging out…"
  subtitle?: string; // "One moment."
  hint?: string; // optional extra line
  toHref?: string; // usually "/"
};

export function AuthLogoutShell({
  pillText,
  title,
  subtitle = 'One moment.',
  hint,
  toHref = '/',
}: Props) {
  return (
    <div className="min-h-screen w-screen bg-[hsl(var(--bg))] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-4">
        {/* Header (match AuthSplitShell pages) */}
        <div className="text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <LearnMetricsLogo variant="icon-blue" href={toHref} />
            {Pill(pillText, 'primary', 'md')}
          </div>

          <div className="mt-3 text-3xl font-semibold text-[hsl(var(--fg))]">{title}</div>
          <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">{subtitle}</div>
        </div>

        {/* Body */}
        <Card className="w-full rounded-4xl border-0 bg-[hsl(var(--card))] shadow-[0_30px_90px_rgba(0,0,0,0.10)] overflow-hidden">
          <CardHeader>
            <CardTitle>Signing you out</CardTitle>
            <CardDescription>Your session is being cleared securely.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress-ish bar */}
            <div className="h-2 w-full overflow-hidden rounded-[999px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
              <div className="h-full w-1/2 animate-pulse bg-[hsl(var(--brand))]" />
            </div>

            {/* Skeleton copy */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>

            {hint ? <div className="text-xs text-[hsl(var(--muted-fg))]">{hint}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
