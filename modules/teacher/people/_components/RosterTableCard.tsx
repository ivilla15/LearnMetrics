'use client';

import * as React from 'react';

import { parseBulkStudentsText, type NewStudentInput } from '@/utils/student/students';
import { Card, CardContent, useToast } from '@/components';

import type { EditingState, RosterStudentRow } from '@/types';

import { RosterToolbar } from './RosterToolbar';
import { BulkAddPanel } from './BulkAddPanel';
import { RosterTable } from './RosterTable';
import { ConfirmModals } from './ConfirmModals';
import { SetupCodeRow } from '@/types/classroom';

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function RosterTableCard(props: {
  classroomId: number;
  students: RosterStudentRow[];
  busy?: boolean;

  onBulkAdd: (students: NewStudentInput[]) => Promise<{ setupCodes: SetupCodeRow[] }>;
  onUpdateStudent: (
    id: number,
    update: { name: string; username: string; level: number },
  ) => Promise<void>;
  onDeleteStudent: (id: number) => Promise<void>;
  onResetAccess: (studentId: number) => Promise<string>;

  onGoProgress: (studentId: number) => void;
  onPrintCards: () => void;
}) {
  const {
    classroomId,
    students,
    busy = false,
    onBulkAdd,
    onUpdateStudent,
    onDeleteStudent,
    onResetAccess,
    onGoProgress,
    onPrintCards,
  } = props;

  const toast = useToast();

  // add panel state
  const [isAdding, setIsAdding] = React.useState(false);
  const [bulkNamesText, setBulkNamesText] = React.useState('');
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  // edit state
  const [editing, setEditing] = React.useState<EditingState | null>(null);

  // selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [bulkDeleteBusy, setBulkDeleteBusy] = React.useState(false);

  // confirm modal states
  const [confirmRemoveId, setConfirmRemoveId] = React.useState<number | null>(null);
  const [confirmResetStudent, setConfirmResetStudent] = React.useState<RosterStudentRow | null>(
    null,
  );
  const [confirmBulkRemoveOpen, setConfirmBulkRemoveOpen] = React.useState(false);

  const existingUsernames = React.useMemo(() => students.map((s) => s.username), [students]);
  const allIds = React.useMemo(() => students.map((s) => s.id), [students]);

  const allSelected = React.useMemo(() => {
    if (allIds.length === 0) return false;
    return allIds.every((id) => selectedIds.has(id));
  }, [allIds, selectedIds]);

  const someSelected = React.useMemo(() => {
    if (allIds.length === 0) return false;
    return allIds.some((id) => selectedIds.has(id)) && !allSelected;
  }, [allIds, selectedIds, allSelected]);

  const selectedCount = selectedIds.size;

  const hasPrintableCodes = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem(`lm_setupCodes_${classroomId}`);
      if (!raw) return false;
      const parsedUnknown: unknown = JSON.parse(raw);
      const setupCodes = (parsedUnknown as { setupCodes?: unknown } | null)?.setupCodes;
      return Array.isArray(setupCodes) && setupCodes.length > 0;
    } catch {
      return false;
    }
  }, [classroomId]);

  // selection helpers
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
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // bulk add handlers
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

      const payload = parseBulkStudentsText(bulkNamesText, existingUsernames);
      if (!payload.length) {
        setBulkError('Please enter at least one valid "First Last" line.');
        return;
      }

      const result = await onBulkAdd(payload);

      setIsAdding(false);
      setBulkNamesText('');
      toast(`Added ${payload.length} student${payload.length === 1 ? '' : 's'}`, 'success');

      if (!Array.isArray(result.setupCodes) || result.setupCodes.length === 0) {
        toast('Students added, but no setup codes returned.', 'error');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not add students.');
      setBulkError(msg);
      toast(msg, 'error');
    }
  };

  // edit handlers
  const handleSaveEditing = async (next: EditingState) => {
    try {
      await onUpdateStudent(next.id, {
        name: next.name,
        username: next.username,
        level: next.level || 1,
      });
      toast('Student updated', 'success');
      setEditing(null);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update student'), 'error');
    }
  };

  // delete handlers
  const handleOpenConfirmRemove = (id: number) => setConfirmRemoveId(id);

  const handleConfirmRemove = async (id: number) => {
    try {
      await onDeleteStudent(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast('Student removed', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to remove student'), 'error');
    } finally {
      setConfirmRemoveId(null);
    }
  };

  // bulk remove handlers
  const handleOpenBulkRemove = () => {
    if (selectedCount === 0) return;
    setConfirmBulkRemoveOpen(true);
  };

  const handleConfirmBulkRemove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setConfirmBulkRemoveOpen(false);
      return;
    }

    try {
      setBulkDeleteBusy(true);
      await Promise.all(ids.map((id) => onDeleteStudent(id)));
      toast(`Removed ${ids.length} student${ids.length === 1 ? '' : 's'}`, 'success');
      clearSelection();
      setConfirmBulkRemoveOpen(false);
    } catch (err) {
      toast(getErrorMessage(err, 'Some students could not be removed.'), 'error');
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  // reset access handlers
  const handleOpenConfirmReset = (student: RosterStudentRow) => setConfirmResetStudent(student);

  const handleConfirmReset = async (studentId: number) => {
    try {
      await onResetAccess(studentId);
      // printing handled by PeopleClient (it navigates), but keeping UX clear
      toast('Setup code generated. Redirecting to print cards…', 'success');
      onPrintCards();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to reset access'), 'error');
    } finally {
      setConfirmResetStudent(null);
    }
  };

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <RosterToolbar
        selectedCount={selectedCount}
        bulkDeleteBusy={bulkDeleteBusy}
        busy={busy}
        hasPrintableCodes={hasPrintableCodes}
        onOpenAdd={handleOpenAdd}
        onOpenBulkRemove={handleOpenBulkRemove}
        onPrintCards={onPrintCards}
      />

      <CardContent className="space-y-5">
        {isAdding ? (
          <BulkAddPanel
            value={bulkNamesText}
            onChange={setBulkNamesText}
            error={bulkError}
            busy={busy}
            onCancel={handleCancelAdd}
            onSave={handleSaveAdd}
          />
        ) : null}

        <RosterTable
          classroomId={classroomId}
          students={students}
          busy={busy}
          bulkDeleteBusy={bulkDeleteBusy}
          editing={editing}
          setEditing={setEditing}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onGoProgress={onGoProgress}
          onOpenConfirmRemove={handleOpenConfirmRemove}
          onOpenConfirmReset={handleOpenConfirmReset}
          allSelected={allSelected}
          someSelected={someSelected}
          toggleAll={toggleAll}
          toggleRow={toggleRow}
          onSaveEditing={handleSaveEditing}
        />
      </CardContent>

      <ConfirmModals
        busy={busy}
        bulkDeleteBusy={bulkDeleteBusy}
        selectedCount={selectedCount}
        confirmBulkRemoveOpen={confirmBulkRemoveOpen}
        onCloseBulkRemove={() => setConfirmBulkRemoveOpen(false)}
        onConfirmBulkRemove={handleConfirmBulkRemove}
        confirmRemoveId={confirmRemoveId}
        onCloseRemove={() => setConfirmRemoveId(null)}
        onConfirmRemove={handleConfirmRemove}
        confirmResetStudent={confirmResetStudent}
        onCloseReset={() => setConfirmResetStudent(null)}
        onConfirmReset={handleConfirmReset}
      />
    </Card>
  );
}
