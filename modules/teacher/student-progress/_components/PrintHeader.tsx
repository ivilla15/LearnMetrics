'use client';

import * as React from 'react';
import type { TeacherStudentProgressDTO } from '@/types';

export function PrintHeader({ data }: { data: TeacherStudentProgressDTO }) {
  const s = data.student;

  return (
    <div className="lm-print-only rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Student Progress Report</div>
      <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
        {s.name} • @{s.username} • {data.classroom.name} • Range: last {data.range.days} days •
        Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
