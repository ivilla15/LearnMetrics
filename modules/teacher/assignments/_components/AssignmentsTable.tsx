import * as React from 'react';

import { Badge, Button } from '@/components';
import { formatLocal } from '@/lib';
import {
  pctTone,
  assignmentStatusTone,
  type TeacherAssignmentListItemDTO,
  formatAssignmentType,
  formatAssignmentMode,
  formatOperation,
} from '@/types';

function formatTargetLine(
  a: Pick<TeacherAssignmentListItemDTO, 'targetKind' | 'numQuestions' | 'durationMinutes'>,
) {
  if (a.targetKind === 'PRACTICE_TIME') {
    return a.durationMinutes ? `${a.durationMinutes} min` : 'Practice time';
  }
  return `${a.numQuestions ?? 12} questions`;
}

export function AssignmentsTable({
  rows,
  onOpen,
  onDelete,
}: {
  classroomId?: number;
  rows: TeacherAssignmentListItemDTO[];
  onOpen: (assignmentId: number) => void;
  onDelete: (assignmentId: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
            <th className="py-3 pl-5 pr-3">Type / Mode</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Opens</th>
            <th className="py-3 px-3">Closes</th>
            <th className="py-3 px-3 text-center">Assigned</th>
            <th className="py-3 px-3 text-center">Attempted</th>
            <th className="py-3 px-3 text-center">Mastery</th>
            <th className="py-3 px-3 text-center">Avg</th>
            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]">
                No assignments match your filters.
              </td>
            </tr>
          ) : (
            rows.map((a) => {
              const assigned = a.stats?.totalStudents ?? 0;
              const attempted = a.stats?.attemptedCount ?? 0;

              const isPracticeTime = a.targetKind === 'PRACTICE_TIME';
              const mastery = isPracticeTime ? null : (a.stats?.masteryRate ?? null);
              const avg = isPracticeTime ? null : (a.stats?.avgPercent ?? null);

              return (
                <tr
                  key={a.assignmentId}
                  className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge tone="muted">{formatAssignmentType(a.type)}</Badge>
                        <Badge tone="muted">{formatAssignmentMode(a.mode)}</Badge>
                        {isPracticeTime ? <Badge tone="muted">Practice time</Badge> : null}
                      </div>

                      <div className="text-xs text-[hsl(var(--muted-fg))]">
                        {formatTargetLine(a)}
                        {a.operation ? ` · ${formatOperation(a.operation)}` : null}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Badge tone={assignmentStatusTone(a.status)}>{a.status}</Badge>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">{formatLocal(a.opensAt)}</td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {a.closesAt ? formatLocal(a.closesAt) : '—'}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {assigned === 0 ? '—' : String(assigned)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isPracticeTime
                      ? '—'
                      : a.status === 'UPCOMING'
                        ? assigned === 0
                          ? '—'
                          : String(assigned)
                        : `${attempted}/${assigned}`}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {a.status === 'FINISHED' && mastery !== null && mastery !== undefined ? (
                      <Badge tone={pctTone(mastery)}>{mastery}%</Badge>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {a.status === 'FINISHED' && avg !== null && avg !== undefined ? (
                      <Badge tone={pctTone(avg)}>{avg}%</Badge>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3 pl-3 pr-5 flex justify-end gap-4">
                    <Button variant="secondary" size="sm" onClick={() => onOpen(a.assignmentId)}>
                      View
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(a.assignmentId)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
