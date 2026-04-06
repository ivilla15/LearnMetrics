'use client';

import * as React from 'react';
import Link from 'next/link';
import type { ClassroomProgressStudentRowDTO, ClassroomProgressLastTestDTO } from '@/types';

const TREND_ICON: Record<ClassroomProgressStudentRowDTO['trendLast3'], string> = {
  improving: '↑',
  regressing: '↓',
  flat: '→',
  need3: '—',
};

const TREND_COLOR: Record<ClassroomProgressStudentRowDTO['trendLast3'], string> = {
  improving: 'text-[hsl(var(--success))]',
  regressing: 'text-[hsl(var(--danger))]',
  flat: 'text-[hsl(var(--muted-fg))]',
  need3: 'text-[hsl(var(--muted-fg))]',
};

type AtRiskRowProps = {
  student: ClassroomProgressStudentRowDTO;
  classroomId: number;
};

export function AtRiskStudentRow({ student, classroomId }: AtRiskRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-medium text-sm text-[hsl(var(--fg))] truncate">{student.name}</span>
        <span className="text-xs text-[hsl(var(--muted-fg))]">
          {student.masteryRateInRange}% mastery
        </span>
        {student.nonMasteryStreak > 0 ? (
          <span className="text-xs text-[hsl(var(--danger))]">
            {student.nonMasteryStreak} non-mastery streak
          </span>
        ) : null}
        <span className={['text-xs font-semibold', TREND_COLOR[student.trendLast3]].join(' ')}>
          {TREND_ICON[student.trendLast3]}
        </span>
      </div>
      <Link
        href={`/teacher/classrooms/${classroomId}/students/${student.id}/progress`}
        className="shrink-0 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
      >
        View Progress
      </Link>
    </div>
  );
}

type NoActivityRowProps = {
  student: ClassroomProgressStudentRowDTO;
  classroomId: number;
};

export function NoActivityStudentRow({ student, classroomId }: NoActivityRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-medium text-sm text-[hsl(var(--fg))] truncate">{student.name}</span>
        <span className="text-xs text-[hsl(var(--muted-fg))]">
          {student.daysSinceLastAttempt != null
            ? `${student.daysSinceLastAttempt}d since last attempt`
            : 'No attempts yet'}
        </span>
        {student.lastPercent != null ? (
          <span className="text-xs text-[hsl(var(--muted-fg))]">
            Last: {student.lastPercent}%
          </span>
        ) : null}
      </div>
      <Link
        href={`/teacher/classrooms/${classroomId}/students/${student.id}/progress`}
        className="shrink-0 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
      >
        View Progress
      </Link>
    </div>
  );
}

type NeedsSetupRowProps = {
  student: ClassroomProgressStudentRowDTO;
  classroomId: number;
};

export function NeedsSetupStudentRow({ student, classroomId }: NeedsSetupRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-medium text-sm text-[hsl(var(--fg))] truncate">{student.name}</span>
        <span className="text-xs text-[hsl(var(--muted-fg))]">@{student.username}</span>
        <span className="text-xs text-[hsl(var(--warning))]">Account not activated</span>
      </div>
      <a
        href={`/teacher/classrooms/${classroomId}/people`}
        className="shrink-0 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
      >
        Send Setup
      </a>
    </div>
  );
}

type MissedTestRowProps = {
  student: ClassroomProgressStudentRowDTO;
  classroomId: number;
  lastTest: ClassroomProgressLastTestDTO | null;
};

export function MissedTestStudentRow({ student, classroomId, lastTest }: MissedTestRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-medium text-sm text-[hsl(var(--fg))] truncate">{student.name}</span>
        <span className="text-xs text-[hsl(var(--muted-fg))]">@{student.username}</span>
        {lastTest ? (
          <span className="text-xs text-[hsl(var(--muted-fg))]">
            Missed {lastTest.mode} test
          </span>
        ) : null}
      </div>
      <Link
        href={`/teacher/classrooms/${classroomId}/students/${student.id}/progress`}
        className="shrink-0 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
      >
        View Progress
      </Link>
    </div>
  );
}
