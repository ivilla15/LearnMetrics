import * as React from 'react';
import type { TeacherAssignmentListItem } from './types';
import { formatLocal } from '@/lib';
import { Badge } from '@/components';
import { Tile } from '../classroom';

export function RecentAssignmentsCards({
  rows,
  onOpen,
}: {
  classroomId: number;
  rows: TeacherAssignmentListItem[];
  onOpen: (assignmentId: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((t) => (
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
              {Badge({ text: `${t.assignmentMode}`, tone: 'muted' })}
              {Badge({ text: `${t.kind}`, tone: 'muted' })}
              {Badge({ text: `${t.numQuestions}`, tone: 'muted' })}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Mastery</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {t.stats.masteryRate}%
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Attempted</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {t.stats.attemptedCount}/{t.stats.totalStudents}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Avg</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {t.stats.avgPercent}%
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
              Closes: {formatLocal(t.closesAt)}
            </div>
          </button>
        </Tile>
      ))}
    </div>
  );
}
