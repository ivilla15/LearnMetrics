import * as React from 'react';
import { formatLocal } from '@/lib';
import { Badge, Tile } from '@/components';
import { pctTone, assignmentStatusTone, type TeacherAssignmentListItemDTO } from '@/types';

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
  onOpen,
}: {
  classroomId: number;
  rows: TeacherAssignmentListItemDTO[];
  onOpen: (assignmentId: number) => void;
}) {
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
            className="group cursor-pointer transition-colors hover:bg-[hsl(var(--surface-2))]"
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
                <Badge tone="muted">{t.type}</Badge>
                <Badge tone="muted">{t.mode}</Badge>
                <Badge tone={assignmentStatusTone(t.status)}>{t.status}</Badge>

                {isPracticeTime ? <Badge tone="muted">Practice time</Badge> : null}
                <Badge tone="muted">{formatTargetBadge(t)}</Badge>

                {t.operation ? <Badge tone="muted">{t.operation}</Badge> : null}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-[hsl(var(--muted-fg))]">Mastery</div>
                  <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                    {mastery === null ? '—' : <Badge tone={pctTone(mastery)}>{mastery}%</Badge>}
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
                    {avg === null ? '—' : <Badge tone={pctTone(avg)}>{avg}%</Badge>}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
                Closes: {t.closesAt ? formatLocal(t.closesAt) : '—'}
              </div>
            </button>
          </Tile>
        );
      })}
    </div>
  );
}
