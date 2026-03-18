'use client';

import * as React from 'react';
import { Badge, Button, HelpText, Input } from '@/components';
import type { RosterStudentRowDTO, RosterEditingStateDTO } from '@/types';
import { getLevelForOp, OPERATION_LABEL } from '@/types';
import type { OperationCode } from '@/types/enums';

export function RosterTable(props: {
  classroomId: number;
  students: RosterStudentRowDTO[];

  busy: boolean;
  bulkDeleteBusy: boolean;

  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  maxNumber: number;

  editing: RosterEditingStateDTO | null;
  setEditing: React.Dispatch<React.SetStateAction<RosterEditingStateDTO | null>>;

  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;

  onGoProgress: (studentId: number) => void;
  onOpenConfirmRemove: (studentId: number) => void;
  onOpenConfirmReset: (student: RosterStudentRowDTO) => void;

  allSelected: boolean;
  someSelected: boolean;

  toggleAll: () => void;
  toggleRow: (studentId: number) => void;

  onSaveEditing: (editing: RosterEditingStateDTO) => void | Promise<void>;
}) {
  const {
    students,
    busy,
    bulkDeleteBusy,
    selectedIds,
    allSelected,
    someSelected,
    toggleAll,
    toggleRow,
    onGoProgress,
    onOpenConfirmRemove,
    onOpenConfirmReset,
    enabledOperations,
    operationOrder,
    maxNumber,
    editing,
    setEditing,
    onSaveEditing,
  } = props;

  function getActiveOpAndLevel(params: {
    progress: Array<{ operation: OperationCode; level: number }>;
    operationOrder: OperationCode[];
    enabledOperations: OperationCode[];
    maxNumber: number;
  }): { operation: OperationCode; level: number } {
    const { progress, operationOrder, enabledOperations, maxNumber } = params;

    const order: OperationCode[] =
      operationOrder.length > 0
        ? operationOrder
        : enabledOperations.length > 0
          ? enabledOperations
          : (['MUL'] as const);

    const byOp = new Map<OperationCode, number>();
    for (const row of progress) byOp.set(row.operation, row.level);

    for (const op of order) {
      const lvl = byOp.get(op) ?? 1;
      if (lvl < maxNumber) return { operation: op, level: lvl };
    }

    const lastOp = order[order.length - 1] ?? 'MUL';
    return { operation: lastOp, level: byOp.get(lastOp) ?? maxNumber };
  }

  function startEditing(student: RosterStudentRowDTO) {
    const active = getActiveOpAndLevel({
      progress: student.progress ?? [],
      operationOrder,
      enabledOperations,
      maxNumber,
    });

    setEditing({
      id: student.id,
      name: student.name,
      username: student.username,
      operation: active.operation,
      level: active.level,
    });
  }

  function setEditingField<K extends keyof Omit<RosterEditingStateDTO, 'id'>>(
    key: K,
    value: string,
  ) {
    setEditing((prev) => {
      if (!prev) return prev;

      if (key === 'level') {
        const n = Number(value);
        return { ...prev, level: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1 };
      }

      return { ...prev, [key]: value } as RosterEditingStateDTO;
    });
  }

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
            <th className="py-3 px-3 text-center">Operation</th>
            <th className="py-3 px-3 text-center">Level</th>
            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 px-5 text-center text-[hsl(var(--muted-fg))]">
                No students yet. Use “Add students” to create your roster.
              </td>
            </tr>
          ) : (
            students.map((student) => {
              const isSelected = selectedIds.has(student.id);
              const isEditingRow = editing?.id === student.id;
              const disabledRow = busy || bulkDeleteBusy;

              const active = getActiveOpAndLevel({
                progress: student.progress ?? [],
                operationOrder,
                enabledOperations,
                maxNumber,
              });

              const displayOp = isEditingRow && editing ? editing.operation : active.operation;
              const displayLevel = isEditingRow && editing ? editing.level : active.level;

              return (
                <tr
                  key={student.id}
                  className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
                >
                  <td className="py-3 pl-5 pr-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(student.id)}
                      aria-label={`Select ${student.name}`}
                      disabled={disabledRow}
                    />
                  </td>

                  <td className="py-3 px-3">
                    {isEditingRow && editing ? (
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditingField('name', e.target.value)}
                        disabled={disabledRow}
                      />
                    ) : (
                      <span className="text-[hsl(var(--fg))] font-medium">{student.name}</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isEditingRow && editing ? (
                      <Input
                        value={editing.username}
                        onChange={(e) => setEditingField('username', e.target.value)}
                        disabled={disabledRow}
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
                    {isEditingRow && editing ? (
                      <select
                        value={editing.operation}
                        onChange={(e) => {
                          const nextOp = e.target.value as OperationCode;
                          const nextLevel = getLevelForOp(student.progress ?? [], nextOp);
                          setEditing((prev) =>
                            prev ? { ...prev, operation: nextOp, level: nextLevel } : prev,
                          );
                        }}
                        disabled={disabledRow}
                        className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
                        aria-label="Operation"
                      >
                        {enabledOperations.map((op) => (
                          <option key={op} value={op}>
                            {OPERATION_LABEL[op]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[hsl(var(--fg))]">{OPERATION_LABEL[displayOp]}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isEditingRow && editing ? (
                      <Input
                        inputMode="numeric"
                        value={String(editing.level)}
                        onChange={(e) => setEditingField('level', e.target.value)}
                        className="w-24"
                        disabled={disabledRow}
                        aria-label="Level"
                      />
                    ) : (
                      <span className="text-[hsl(var(--fg))]">{displayLevel}</span>
                    )}
                  </td>

                  <td className="py-3 pl-3 pr-5">
                    {isEditingRow && editing ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(null)}
                          disabled={disabledRow}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void onSaveEditing(editing)}
                          disabled={disabledRow}
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
                          disabled={disabledRow}
                        >
                          Progress
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenConfirmReset(student)}
                          disabled={disabledRow}
                        >
                          Reset access
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEditing(student)}
                          disabled={disabledRow}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onOpenConfirmRemove(student.id)}
                          disabled={disabledRow}
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
