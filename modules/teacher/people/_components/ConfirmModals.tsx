'use client';

import * as React from 'react';
import { Modal, Button, HelpText } from '@/components';
import type { RosterStudentRow } from '@/types';

export function ConfirmModals(props: {
  busy: boolean;
  bulkDeleteBusy: boolean;

  selectedCount: number;

  confirmBulkRemoveOpen: boolean;
  onCloseBulkRemove: () => void;
  onConfirmBulkRemove: () => void;

  confirmRemoveId: number | null;
  onCloseRemove: () => void;
  onConfirmRemove: (studentId: number) => void;

  confirmResetStudent: RosterStudentRow | null;
  onCloseReset: () => void;
  onConfirmReset: (studentId: number) => void;
}) {
  const {
    busy,
    bulkDeleteBusy,
    selectedCount,
    confirmBulkRemoveOpen,
    onCloseBulkRemove,
    onConfirmBulkRemove,
    confirmRemoveId,
    onCloseRemove,
    onConfirmRemove,
    confirmResetStudent,
    onCloseReset,
    onConfirmReset,
  } = props;

  return (
    <>
      {/* Confirm: bulk remove */}
      <Modal
        open={confirmBulkRemoveOpen}
        onClose={onCloseBulkRemove}
        title="Remove selected students?"
        description="This will remove the selected students from this classroom. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onCloseBulkRemove}
              disabled={busy || bulkDeleteBusy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmBulkRemove}
              disabled={busy || bulkDeleteBusy}
            >
              {bulkDeleteBusy ? 'Removing…' : `Remove (${selectedCount})`}
            </Button>
          </div>
        }
      >
        <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm">
          These students will lose access to this classroom. Their accounts may still exist if
          they’re in other classrooms.
        </div>
      </Modal>

      {/* Confirm: remove single */}
      <Modal
        open={confirmRemoveId !== null}
        onClose={onCloseRemove}
        title="Remove student?"
        description="This will remove the student from this classroom. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCloseRemove} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRemoveId === null) return;
                onConfirmRemove(confirmRemoveId);
              }}
              disabled={busy}
            >
              Remove student
            </Button>
          </div>
        }
      >
        <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm">
          Removing a student revokes access to this classroom immediately.
        </div>
      </Modal>

      {/* Confirm: reset access */}
      <Modal
        open={confirmResetStudent !== null}
        onClose={onCloseReset}
        title="Reset student access?"
        description="This will invalidate the student’s password and generate a new setup code."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCloseReset} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirmResetStudent) return;
                onConfirmReset(confirmResetStudent.id);
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
    </>
  );
}
