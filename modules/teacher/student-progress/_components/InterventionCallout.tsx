'use client';

import * as React from 'react';
import type { TeacherStudentProgressDTO } from '@/types';

type Student = TeacherStudentProgressDTO['student'];

type Intervention = {
  key: string;
  tone: 'danger' | 'warning' | 'success';
  message: string;
};

function buildInterventions(student: Student): Intervention[] {
  const { flags, masteryStreak, nonMasteryStreak } = student;
  const interventions: Intervention[] = [];

  if (flags.atRisk) {
    interventions.push({
      key: 'atRisk',
      tone: 'warning',
      message:
        'This student is flagged at risk based on recent performance trends.',
    });
  }

  if (flags.nonMasteryStreak2) {
    interventions.push({
      key: 'nonMasteryStreak2',
      tone: 'danger',
      message: `This student has missed mastery on their last ${nonMasteryStreak}+ attempts. Consider a check-in or remediation assignment.`,
    });
  }

  if (flags.stale14Days) {
    interventions.push({
      key: 'stale14',
      tone: 'warning',
      message: 'No activity in 14+ days. Consider re-engagement.',
    });
  }

  if ((masteryStreak ?? 0) >= 3) {
    interventions.push({
      key: 'masteryStreak',
      tone: 'success',
      message: `On a mastery streak! This student has mastered their last ${masteryStreak} attempts.`,
    });
  }

  return interventions;
}

const TONE_STYLES: Record<Intervention['tone'], string> = {
  danger:
    'bg-[hsl(var(--danger)/0.08)] border-[hsl(var(--danger)/0.25)] text-[hsl(var(--danger))]',
  warning:
    'bg-[hsl(var(--warning)/0.08)] border-[hsl(var(--warning)/0.25)] text-[hsl(var(--warning))]',
  success:
    'bg-[hsl(var(--success)/0.08)] border-[hsl(var(--success)/0.25)] text-[hsl(var(--success))]',
};

const TONE_ICONS: Record<Intervention['tone'], string> = {
  danger: '⚠',
  warning: '⚠',
  success: '✓',
};

export function InterventionCallout({ student }: { student: Student }) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const interventions = React.useMemo(
    () => buildInterventions(student).filter((i) => !dismissed.has(i.key)),
    [student, dismissed],
  );

  if (interventions.length === 0) return null;

  return (
    <div className="space-y-2">
      {interventions.map((i) => (
        <div
          key={i.key}
          className={[
            'flex items-start justify-between gap-3 rounded-[14px] border px-4 py-3 text-sm',
            TONE_STYLES[i.tone],
          ].join(' ')}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">{TONE_ICONS[i.tone]}</span>
            <span>{i.message}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() =>
              setDismissed((prev) => {
                const next = new Set(prev);
                next.add(i.key);
                return next;
              })
            }
            className="flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer text-base leading-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
