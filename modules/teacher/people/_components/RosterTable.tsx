'use client';

import * as React from 'react';
import { Button, Badge, Input, HelpText } from '@/components';
import type { EditingState, RosterStudentRow } from '@/types';

export function RosterTable(props: {
  classroomId: number;
  students: RosterStudentRow[];

  busy: boolean;
  bulkDeleteBusy: boolean;

  editing: EditingState | null;
  setEditing: React.Dispatch<React.SetStateAction<EditingState | null>>;

  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;

  onGoProgress: (studentId: number) => void;
  onOpenConfirmRemove: (studentId: number) => void;
  onOpenConfirmReset: (student: RosterStudentRow) => void;

  allSelected: boolean;
  someSelected: boolean;

  toggleAll: () => void;
  toggleRow: (studentId: number) => void;

  onSaveEditing: (editing: EditingState) => void | Promise<void>;
}) {
  const {
    students,
    busy,
    bulkDeleteBusy,
    editing,
    setEditing,
    selectedIds,
    allSelected,
    someSelected,
    toggleAll,
    toggleRow,
    onGoProgress,
    onOpenConfirmRemove,
    onOpenConfirmReset,
    onSaveEditing,
  } = props;

  const startEditing = (student: RosterStudentRow) => {
    setEditing({
      id: student.id,
      name: student.name,
      username: student.username,
      level: student.level,
    });
  };

  const handleEditingChange = (field: keyof Omit<EditingState, 'id'>, value: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: field === 'level' ? Number(value) || 1 : value,
      };
    });
  };

  return (
    <div className="overflow-x-auto rounded-[28px] overflow-hidden bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
      <table className="w-full text-sm">
        <thead className="bg-[hsl(var(--surface-2))]">
          <tr className="text-left border-b border-[hsl(var(--border))]">
            <th className="py-3 pl-5 pr-3 w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (!el) return;
                  el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                aria-label="Select all students"
                disabled={busy || bulkDeleteBusy}
              />
            </th>

            <th className="py-3 px-3">Name</th>
            <th className="py-3 px-3">Username</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3 text-center">Level</th>
            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 px-5 text-center text-[hsl(var(--muted-fg))]">
                No students yet. Use “Add students” to create your roster.
              </td>
            </tr>
          ) : (
            students.map((student) => {
              const isEditingRow = editing?.id === student.id;
              const isSelected = selectedIds.has(student.id);

              return (
                <tr
                  key={student.id}
                  className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                >
                  <td className="py-3 pl-5 pr-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(student.id)}
                      aria-label={`Select ${student.name}`}
                      disabled={busy || bulkDeleteBusy}
                    />
                  </td>

                  <td className="py-3 px-3">
                    {isEditingRow ? (
                      <Input
                        value={editing.name}
                        onChange={(e) => handleEditingChange('name', e.target.value)}
                      />
                    ) : (
                      <span className="text-[hsl(var(--fg))]">{student.name}</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isEditingRow ? (
                      <Input
                        value={editing.username}
                        onChange={(e) => handleEditingChange('username', e.target.value)}
                      />
                    ) : (
                      <span className="font-mono text-xs text-[hsl(var(--fg))]">
                        {student.username}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {student.mustSetPassword ? (
                      <Badge tone="warning">Needs setup</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isEditingRow ? (
                      <Input
                        inputMode="numeric"
                        value={String(editing.level)}
                        onChange={(e) => handleEditingChange('level', e.target.value)}
                      />
                    ) : (
                      <span className="text-[hsl(var(--fg))]">{student.level}</span>
                    )}
                  </td>

                  <td className="py-3 pl-3 pr-5">
                    {isEditingRow ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(null)}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (editing) onSaveEditing(editing);
                          }}
                          disabled={busy}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onGoProgress(student.id)}
                          disabled={busy}
                        >
                          Progress
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenConfirmReset(student)}
                          disabled={busy}
                        >
                          Reset access
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEditing(student)}
                          disabled={busy}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onOpenConfirmRemove(student.id)}
                          disabled={busy}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="px-7 py-4">
        <HelpText>
          Tip: Use checkboxes to remove multiple students at once. “Reset access” generates a new
          one-time setup code.
        </HelpText>
      </div>
    </div>
  );
}
