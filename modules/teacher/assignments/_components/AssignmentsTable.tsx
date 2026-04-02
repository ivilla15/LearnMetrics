'use client';

import * as React from 'react';
import { Badge, Button, Skeleton } from '@/components';
import { formatLocal } from '@/lib';
import {
  pctTone,
  assignmentStatusTone,
  type TeacherAssignmentListItemDTO,
  formatAssignmentType,
  formatAssignmentMode,
  formatOperation,
  formatCalendarTargetLine,
} from '@/types';

export function AssignmentsTable({
  rows,
  loading = false,
  onOpen,
  onDelete,
}: {
  classroomId?: number;
  rows: TeacherAssignmentListItemDTO[];
  loading?: boolean;
  onOpen: (assignmentId: number) => void;
  onDelete: (assignmentId: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
            <th className="py-4 pl-5 pr-3 font-semibold text-[hsl(var(--fg))]">Type / Mode</th>
            <th className="py-4 px-3 font-semibold text-[hsl(var(--fg))]">Status</th>
            <th className="py-4 px-3 font-semibold text-[hsl(var(--fg))]">Opens</th>
            <th className="py-4 px-3 font-semibold text-[hsl(var(--fg))]">Closes</th>
            <th className="py-4 px-3 text-center font-semibold text-[hsl(var(--fg))]">Assigned</th>
            <th className="py-4 px-3 text-center font-semibold text-[hsl(var(--fg))]">Attempted</th>
            <th className="py-4 px-3 text-center font-semibold text-[hsl(var(--fg))]">Mastery</th>
            <th className="py-4 px-3 text-center font-semibold text-[hsl(var(--fg))]">Avg</th>
            <th className="py-4 pl-3 pr-5 text-right font-semibold text-[hsl(var(--fg))]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[hsl(var(--border))]">
          {loading ? (
            // Loading Skeleton Rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="animate-pulse">
                <td className="py-4 pl-5 pr-3">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                </td>
                <td className="py-4 px-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="py-4 px-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="py-4 px-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="py-4 px-3">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-8" />
                  </div>
                </td>
                <td className="py-4 px-3">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-12" />
                  </div>
                </td>
                <td className="py-4 px-3">
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </td>
                <td className="py-4 px-3">
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </td>
                <td className="py-4 pl-3 pr-5">
                  <div className="flex justify-end gap-3">
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 px-3 text-center text-[hsl(var(--muted-fg))] italic">
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
                  className="hover:bg-[hsl(var(--surface-2)/0.5)] transition-colors"
                >
                  <td className="py-4 pl-5 pr-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {isPracticeTime ? (
                          <Badge tone="muted">Practice sets</Badge>
                        ) : (
                          <Badge tone="muted">{formatAssignmentType(a.type)}</Badge>
                        )}
                        <Badge tone="muted">{formatAssignmentMode(a.mode)}</Badge>
                      </div>

                      <div className="text-xs text-[hsl(var(--muted-fg))]">
                        {formatCalendarTargetLine(a)}
                        {a.operation ? ` · ${formatOperation(a.operation)}` : null}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <Badge tone={assignmentStatusTone(a.status)}>{a.status}</Badge>
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap text-[hsl(var(--fg))]">
                    {formatLocal(a.opensAt)}
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap text-[hsl(var(--muted-fg))]">
                    {a.closesAt ? formatLocal(a.closesAt) : '—'}
                  </td>

                  <td className="py-4 px-3 text-center text-[hsl(var(--fg))]">
                    {assigned === 0 ? '—' : String(assigned)}
                  </td>

                  <td className="py-4 px-3 text-center text-[hsl(var(--fg))]">
                    {isPracticeTime
                      ? '—'
                      : a.status === 'UPCOMING'
                        ? assigned === 0
                          ? '—'
                          : String(assigned)
                        : `${attempted}/${assigned}`}
                  </td>

                  <td className="py-4 px-3 text-center">
                    {a.status === 'FINISHED' && mastery !== null && mastery !== undefined ? (
                      <Badge tone={pctTone(mastery)}>{mastery}%</Badge>
                    ) : (
                      <span className="text-[hsl(var(--muted-fg))]">—</span>
                    )}
                  </td>

                  <td className="py-4 px-3 text-center">
                    {a.status === 'FINISHED' && avg !== null && avg !== undefined ? (
                      <Badge tone={pctTone(avg)}>{avg}%</Badge>
                    ) : (
                      <span className="text-[hsl(var(--muted-fg))]">—</span>
                    )}
                  </td>

                  <td className="py-4 pl-3 pr-5">
                    <div className="flex justify-end gap-3">
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
                    </div>
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
