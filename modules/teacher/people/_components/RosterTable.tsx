'use client';

import * as React from 'react';
import { Badge, Button, HelpText, Input } from '@/components';
import type { RosterStudentRowDTO, RosterEditingStateDTO } from '@/types';
import { DOMAIN_CONFIG, getDomainLabel } from '@/core/domain';
import type { DomainCode } from '@/types/domain';

function getLevelForDomain(
  progress: { domain: string; level: number }[],
  domain: DomainCode,
): number {
  return progress.find((d) => d.domain === domain)?.level ?? 1;
}

function getActiveDomain(params: {
  progress: { domain: string; level: number }[];
  enabledDomains: DomainCode[];
}): { domain: DomainCode; level: number } {
  const { progress, enabledDomains } = params;
  const byDomain = new Map(progress.map((d) => [d.domain, d.level]));
  for (const domain of enabledDomains) {
    const maxLevel = DOMAIN_CONFIG[domain]?.maxLevel ?? 12;
    const level = byDomain.get(domain) ?? 1;
    if (level <= maxLevel) return { domain, level };
  }
  return { domain: enabledDomains[0] ?? 'MUL_WHOLE', level: 1 };
}

export function RosterTable(props: {
  classroomId: number;
  students: RosterStudentRowDTO[];

  busy: boolean;
  bulkDeleteBusy: boolean;

  enabledDomains: DomainCode[];
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
    enabledDomains,
    editing,
    setEditing,
    onSaveEditing,
  } = props;

  function startEditing(student: RosterStudentRowDTO) {
    const active = getActiveDomain({
      progress: student.progress,
      enabledDomains,
    });

    setEditing({
      id: student.id,
      name: student.name,
      username: student.username,
      domain: active.domain,
      level: active.level,
    });
  }

  const [levelInput, setLevelInput] = React.useState('');

  React.useEffect(() => {
    if (editing) setLevelInput(String(editing.level));
    else setLevelInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id, editing?.domain]);

  function setEditingField<K extends keyof Omit<RosterEditingStateDTO, 'id'>>(
    key: K,
    value: string,
  ) {
    setEditing((prev) => {
      if (!prev) return prev;

      if (key === 'level') {
        if (value === '') return prev;
        const n = Number(value);
        return { ...prev, level: Number.isFinite(n) && n > 0 ? Math.trunc(n) : prev.level };
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
            <th className="py-3 px-3 text-center">Domain</th>
            <th className="py-3 px-3 text-center">Level</th>
            <th className="py-3 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 px-5 text-center text-[hsl(var(--muted-fg))]">
                No students yet. Use &quot;Add students&quot; to create your roster.
              </td>
            </tr>
          ) : (
            students.map((student) => {
              const isSelected = selectedIds.has(student.id);
              const isEditingRow = editing?.id === student.id;
              const disabledRow = busy || bulkDeleteBusy;

              const active = getActiveDomain({
                progress: student.progress,
                enabledDomains,
              });

              const displayDomain = isEditingRow && editing ? editing.domain : active.domain;
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
                        value={editing.domain}
                        onChange={(e) => {
                          const nextDomain = e.target.value as DomainCode;
                          const nextLevel = getLevelForDomain(student.progress, nextDomain);
                          setEditing((prev) =>
                            prev ? { ...prev, domain: nextDomain, level: nextLevel } : prev,
                          );
                        }}
                        disabled={disabledRow}
                        className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
                        aria-label="Domain"
                      >
                        {enabledDomains.map((domain) => (
                          <option key={domain} value={domain}>
                            {getDomainLabel(domain)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[hsl(var(--fg))]">{getDomainLabel(displayDomain)}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isEditingRow && editing ? (
                      <Input
                        inputMode="numeric"
                        value={levelInput}
                        onChange={(e) => {
                          setLevelInput(e.target.value);
                          setEditingField('level', e.target.value);
                        }}
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
          Tip: Use checkboxes to remove multiple students at once. &quot;Reset access&quot; generates a new
          one-time setup code.
        </HelpText>
      </div>
    </div>
  );
}
