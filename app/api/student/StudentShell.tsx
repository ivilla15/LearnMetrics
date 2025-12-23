// app/student/StudentShell.tsx
'use client';

import type { ReactNode } from 'react';

export function StudentShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        {children}
      </div>
    </div>
  );
}
