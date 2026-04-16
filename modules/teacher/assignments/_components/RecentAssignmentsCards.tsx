'use client';

import * as React from 'react';
import { formatLocal } from '@/lib';
import { Badge, Tile, Skeleton } from '@/components';
import {
  pctTone,
  assignmentStatusTone,
  type TeacherAssignmentListItemDTO,
  formatAssignmentType,
  formatAssignmentMode,
} from '@/types';

function formatTargetBadge(
  a: Pick<TeacherAssignmentListItemDTO, 'targetKind' | 'numQuestions' | 'durationMinutes'>,
) {
  if (a.targetKind === 'PRACTICE_TIME') {
    return a.durationMinutes ? `${a.durationMinutes} min` : 'Practice time';
  }
  return `${a.numQuestions ?? 12} Q`;
}

export function RecentAssignmentsCards({
  rows,
  loading = false,
  onOpen,
}: {
  classroomId: number;
  rows: TeacherAssignmentListItemDTO[];
  loading?: boolean;
  onOpen: (assignmentId: number) => void;
}) {
  // If loading and we have no rows, or just loading in general
  if (loading && rows.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Tile key={`skeleton-card-${i}`} className="p-4 space-y-4">
            <Skeleton className="h-3 w-32" /> {/* Opens At text */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
            <Skeleton className="h-3 w-40 mt-2" /> {/* Closes At text */}
          </Tile>
        ))}
      </div>
    );
  }

  // Empty state (after loading finishes)
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[hsl(var(--muted-fg))] italic border-2 border-dashed border-[hsl(var(--border))] rounded-[28px]">
        No recent assignments found.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((t) => {
        const assigned = t.stats?.totalStudents ?? 0;
        const attempted = t.stats?.attemptedCount ?? 0;

        const isPracticeTime = t.targetKind === 'PRACTICE_TIME';

        const mastery =
          !isPracticeTime && t.status === 'FINISHED' ? (t.stats?.masteryRate ?? null) : null;
        const avg =
          !isPracticeTime && t.status === 'FINISHED' ? (t.stats?.avgPercent ?? null) : null;

        return (
          <Tile
            key={t.assignmentId}
            className="group cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md hover:bg-[hsl(var(--surface-2))]"
          >
            <button
              type="button"
              onClick={() => onOpen(t.assignmentId)}
              className="w-full text-left rounded-[14px] bg-transparent p-4 transition-colors"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Opens: {formatLocal(t.opensAt)}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="muted">{formatAssignmentType(t.type)}</Badge>
                <Badge tone="muted">{formatAssignmentMode(t.mode)}</Badge>
                <Badge tone={assignmentStatusTone(t.status)}>{t.status}</Badge>

                {isPracticeTime ? <Badge tone="muted">Practice time</Badge> : null}
                <Badge tone="muted">{formatTargetBadge(t)}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-[hsl(var(--muted-fg))]">Mastery</div>
                  <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                    {mastery === null ? (
                      <span className="text-[hsl(var(--muted-fg))]">—</span>
                    ) : (
                      <Badge tone={pctTone(mastery)}>{mastery}%</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[hsl(var(--muted-fg))]">
                    {t.status === 'UPCOMING'
                      ? 'Assigned'
                      : isPracticeTime
                        ? 'Assigned'
                        : 'Attempted'}
                  </div>
                  <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                    {assigned === 0
                      ? '—'
                      : t.status === 'UPCOMING' || isPracticeTime
                        ? `${assigned}`
                        : `${attempted}/${assigned}`}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[hsl(var(--muted-fg))]">Avg</div>
                  <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                    {avg === null ? (
                      <span className="text-[hsl(var(--muted-fg))]">—</span>
                    ) : (
                      <Badge tone={pctTone(avg)}>{avg}%</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-fg))]">
                  Closes: {t.closesAt ? formatLocal(t.closesAt) : '—'}
                </span>
                {(t.stats?.flaggedCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-[hsl(var(--danger)/0.12)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--danger))]">
                    {t.stats.flaggedCount} flagged
                  </span>
                ) : (t.stats?.integrityEventCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {t.stats.integrityEventCount} event{t.stats.integrityEventCount !== 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            </button>
          </Tile>
        );
      })}
    </div>
  );
}
