'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import type { StudentRow } from '@/modules/teacher/classroom';
import {
  useToast,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  HelpText,
  Input,
  Label,
  Modal,
} from '@/components';
import { type NewStudentInput, parseBulkStudentsText } from '@/utils/students';

type SetupCodeRow = {
  studentId: number;
  username: string;
  name: string;
  setupCode: string;
  expiresAt: string;
};

type RosterTableProps = {
  classroomId: number;
  students: StudentRow[];
  busy?: boolean;

  onBulkAdd: (students: NewStudentInput[]) => Promise<{ setupCodes: SetupCodeRow[] }>;
  onUpdateStudent: (
    id: number,
    update: { name: string; username: string; level: number },
  ) => Promise<void>;
  onDeleteStudent: (id: number) => Promise<void>;

  onResetAccess: (
    studentId: number,
  ) => Promise<{ studentId: number; username: string; setupCode: string }>;
};

type EditingState = {
  id: number;
  name: string;
  username: string;
  level: number;
};

export function RosterTable({
  classroomId,
  students,
  busy = false,
  onBulkAdd,
  onUpdateStudent,
  onDeleteStudent,
  onResetAccess,
}: RosterTableProps) {
  const toast = useToast();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState | null>(null);

  // Selection (checkboxes)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);

  const existingUsernames = useMemo(() => students.map((s) => s.username), [students]);

  // confirm modals
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [confirmResetStudent, setConfirmResetStudent] = useState<StudentRow | null>(null);

  const hasPrintableCodes = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(`lm_setupCodes_${classroomId}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.setupCodes) && parsed.setupCodes.length > 0;
    } catch {
      return false;
    }
  }, [classroomId]);

  const allIds = useMemo(() => students.map((s) => s.id), [students]);

  const allSelected = useMemo(() => {
    if (allIds.length === 0) return false;
    return allIds.every((id) => selectedIds.has(id));
  }, [allIds, selectedIds]);

  const someSelected = useMemo(() => {
    if (allIds.length === 0) return false;
    return allIds.some((id) => selectedIds.has(id)) && !allSelected;
  }, [allIds, selectedIds, allSelected]);

  const selectedCount = selectedIds.size;

  const handlePrintCards = () => {
    router.push(`/teacher/classrooms/${classroomId}/print-cards`);
  };

  // ----- Selection helpers -----
  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // deselect all
        allIds.forEach((id) => next.delete(id));
      } else {
        // select all
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ----- Bulk add -----
  const handleOpenAdd = () => {
    setBulkNamesText('');
    setBulkError(null);
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setBulkError(null);
  };

  const handleSaveAdd = async () => {
    if (!bulkNamesText.trim()) {
      setBulkError('Please enter at least one line with "First Last".');
      return;
    }

    try {
      setBulkError(null);

      // parseBulkStudentsText will throw on bad lines (we catch below)
      const payload = parseBulkStudentsText(bulkNamesText, existingUsernames);

      if (!payload.length) {
        setBulkError('Please enter at least one valid "First Last" line.');
        return;
      }

      const result = await onBulkAdd(payload);

      setIsAdding(false);
      setBulkNamesText('');
      toast(`Added ${payload.length} student${payload.length === 1 ? '' : 's'}`, 'success');

      if (Array.isArray(result.setupCodes) && result.setupCodes.length > 0) {
        router.push(`/teacher/classrooms/${classroomId}/print-cards`);
      } else {
        toast(
          'Students added. No setup codes returned (duplicates may have been skipped).',
          'error',
        );
      }
    } catch (err) {
      console.error(err);
      const message = (err as Error)?.message || 'Could not add students. Please try again.';
      setBulkError(message);
      toast('Failed to add students', 'error');
    }
  };
  // ----- Edit row -----
  const startEditing = (student: StudentRow) => {
    setEditing({
      id: student.id,
      name: student.name,
      username: student.username,
      level: student.level,
    });
  };

  const cancelEditing = () => setEditing(null);

  const handleEditingChange = (field: keyof Omit<EditingState, 'id'>, value: string) => {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === 'level' ? Number(value) || 1 : value,
          }
        : prev,
    );
  };

  const saveEditing = async () => {
    if (!editing) return;
    try {
      await onUpdateStudent(editing.id, {
        name: editing.name,
        username: editing.username,
        level: editing.level || 1,
      });
      toast('Student updated', 'success');
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast('Failed to update student', 'error');
    }
  };

  // ----- Delete single -----
  const handleDeleteStudent = (id: number) => {
    setConfirmRemoveId(id);
  };

  // ----- Bulk delete selected -----
  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = window.confirm(
      `Remove ${ids.length} student${ids.length === 1 ? '' : 's'} from this classroom?`,
    );
    if (!confirmed) return;

    try {
      setBulkDeleteBusy(true);

      // Simple approach: call your existing delete endpoint per student
      await Promise.all(ids.map((id) => onDeleteStudent(id)));

      toast(`Removed ${ids.length} student${ids.length === 1 ? '' : 's'}`, 'success');
      clearSelection();
    } catch (err) {
      console.error(err);
      toast('Some students could not be removed. Please try again.', 'error');
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  // ----- Reset access -----
  const handleResetAccess = (student: StudentRow) => {
    setConfirmResetStudent(student);
  };

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>People</CardTitle>
            <CardDescription>Manage students, reset access, or edit details.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 ? (
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={busy || bulkDeleteBusy}
              >
                {bulkDeleteBusy ? 'Removing…' : `Remove selected (${selectedCount})`}
              </Button>
            ) : null}

            {hasPrintableCodes ? (
              <Button variant="secondary" onClick={handlePrintCards}>
                Print login cards
              </Button>
            ) : null}

            <Button onClick={handleOpenAdd} disabled={busy}>
              + Add students
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Bulk add */}
        {isAdding ? (
          <div className="rounded-[28px] hover:-translate-y-px bg-[hsl(var(--surface-2))] p-5 space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                Add multiple students
              </div>
              <HelpText>
                One student per line. Optionally append a level after a comma:{' '}
                <code>First Last, 5</code>
              </HelpText>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-names">Student names</Label>
              <textarea
                id="bulk-names"
                rows={6}
                value={bulkNamesText}
                onChange={(e) => setBulkNamesText(e.target.value)}
                className="w-full rounded-(--radius) hover:-translate-y-px bg-[hsl(var(--surface))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--border-strong))]"
                placeholder={`Ada Lovelace\nAlan Turing, 5\nGrace Hopper, 12`}
              />
              {bulkError ? (
                <div className="text-xs text-[hsl(var(--danger))]">{bulkError}</div>
              ) : null}
              <HelpText>
                Usernames are generated as{' '}
                <span className="font-mono">firstInitial + lastName</span>. Students receive a
                one-time setup code to choose their password.
              </HelpText>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleCancelAdd} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd} disabled={busy}>
                {busy ? 'Saving…' : 'Add students'}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-x-auto overflow-hidden rounded-[28px] hover:-translate-y-px bg-[hsl(var(--surface))]">
          <table className="w-full text-sm border-separate border-spacing-0">
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
                      className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
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
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border',
                            student.mustSetPassword
                              ? 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]'
                              : 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]',
                          ].join(' ')}
                        >
                          {student.mustSetPassword ? 'Needs setup' : 'Active'}
                        </span>
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
                              onClick={cancelEditing}
                              disabled={busy}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={saveEditing} disabled={busy}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm">
                              <Link
                                href={`/teacher/classrooms/${classroomId}/students/${student.id}/progress`}
                              >
                                Progress
                              </Link>
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResetAccess(student)}
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
                              onClick={() => handleDeleteStudent(student.id)}
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
        </div>

        <HelpText>
          Tip: Use checkboxes to remove multiple students at once. “Reset access” generates a new
          one-time setup code.
        </HelpText>
      </CardContent>
      <Modal
        open={confirmRemoveId !== null}
        onClose={() => setConfirmRemoveId(null)}
        title="Remove student?"
        description="This will remove the student from this classroom. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmRemoveId(null)} disabled={busy}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmRemoveId === null) return;

                try {
                  await onDeleteStudent(confirmRemoveId);
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(confirmRemoveId);
                    return next;
                  });
                  toast('Student removed', 'success');
                } catch {
                  toast('Failed to remove student', 'error');
                } finally {
                  setConfirmRemoveId(null);
                }
              }}
              disabled={busy}
            >
              Remove student
            </Button>
          </div>
        }
      >
        <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm">
          Removing a student deletes their access and attempts associated with this classroom.
        </div>
      </Modal>
      <Modal
        open={confirmResetStudent !== null}
        onClose={() => setConfirmResetStudent(null)}
        title="Reset student access?"
        description="This will invalidate the student’s password and generate a new setup code."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmResetStudent(null)}
              disabled={busy}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (!confirmResetStudent) return;

                try {
                  const row = await onResetAccess(confirmResetStudent.id);
                  toast(`New setup code generated for ${row.username}`, 'success');
                  router.push(`/teacher/classrooms/${classroomId}/print-cards`);
                } catch {
                  toast('Failed to reset access', 'error');
                } finally {
                  setConfirmResetStudent(null);
                }
              }}
              disabled={busy}
            >
              Reset access
            </Button>
          </div>
        }
      >
        {confirmResetStudent ? (
          <div className="space-y-2 text-sm">
            <div>
              You’re about to reset access for{' '}
              <span className="font-semibold">{confirmResetStudent.name}</span>.
            </div>

            <HelpText>The student will need a new one-time setup code to sign in again.</HelpText>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
