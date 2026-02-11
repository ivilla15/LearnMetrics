import * as React from 'react';
import { Button } from '@/components';
import { formatLocal } from '@/lib';
import { TeacherAssignmentListItem } from '@/types';

export function AssignmentsTable({
  rows,
  onOpen,
  onDelete,
}: {
  classroomId: number;
  rows: TeacherAssignmentListItem[];
  onOpen: (assignmentId: number) => void;
  onDelete: (assignmentId: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
            <th className="py-3 pl-5 pr-3">Assignment Type</th>
            <th className="py-3 px-3">Opens</th>
            <th className="py-3 px-3">Closes</th>
            <th className="py-3 px-3 text-center">Attempted</th>
            <th className="py-3 px-3 text-center">Mastery</th>
            <th className="py-3 px-3 text-center">Avg</th>
            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]">
                No assignments match your filters.
              </td>
            </tr>
          ) : (
            rows.map((a) => (
              <tr
                key={a.assignmentId}
                className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
              >
                <td className="py-3 pl-5 pr-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-[hsl(var(--fg))] font-medium">{a.mode} Assignment</div>
                    <div className="text-xs text-[hsl(var(--muted-fg))]">
                      {a.mode} · {a.kind} · {a.numQuestions} questions
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3 whitespace-nowrap">{formatLocal(a.opensAt)}</td>
                <td className="py-3 px-3 whitespace-nowrap">{formatLocal(a.closesAt)}</td>

                <td className="py-3 px-3 text-center">
                  {a.stats.attemptedCount}/{a.stats.totalStudents}
                </td>

                <td className="py-3 px-3 text-center">{a.stats.masteryRate}%</td>
                <td className="py-3 px-3 text-center">{a.stats.avgPercent}%</td>

                <td className="py-3 pl-3 pr-5 flex justify-end gap-4">
                  <Button variant="secondary" size="sm" onClick={() => onOpen(a.assignmentId)}>
                    View
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(a.assignmentId)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
