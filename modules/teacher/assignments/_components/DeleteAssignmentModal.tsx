'use client';

import * as React from 'react';
import { Button, Modal } from '@/components';
import { deleteAssignment } from '../actions';

export function DeleteAssignmentModal(props: {
  open: boolean;
  classroomId: number;
  assignmentId: number | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { open, classroomId, assignmentId, onClose, onDeleted } = props;
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onConfirm() {
    if (assignmentId == null) return;

    setBusy(true);
    setError(null);
    try {
      await deleteAssignment({ classroomId, assignmentId });
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete assignment');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Delete assignment?"
      description="This will permanently delete the assignment. This cannot be undone."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>

          <Button variant="destructive" disabled={busy || assignmentId == null} onClick={onConfirm}>
            {busy ? 'Deleting…' : 'Delete assignment'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm">
          Deleting an assignment removes it from this classroom. Students will no longer be able to
          access it.
        </div>

        {error ? <div className="text-xs text-[hsl(var(--danger))]">{error}</div> : null}
      </div>
    </Modal>
  );
}
