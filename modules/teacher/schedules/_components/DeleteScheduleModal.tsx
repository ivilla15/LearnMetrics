'use client';

import * as React from 'react';
import { Modal, Button, HelpText } from '@/components';
import type { ScheduleDTO } from '@/types';

export function DeleteScheduleModal(props: {
  open: boolean;
  schedule: ScheduleDTO | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (scheduleId: number) => void | Promise<void>;
}) {
  const { open, schedule, busy, onClose, onConfirm } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete schedule?"
      description="This will permanently delete the schedule. This cannot be undone."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!schedule) return;
              void onConfirm(schedule.id);
            }}
            disabled={busy || !schedule}
          >
            {busy ? 'Deleting…' : 'Delete schedule'}
          </Button>
        </div>
      }
    >
      {schedule ? (
        <div className="space-y-2 text-sm">
          <div>
            You’re about to delete this schedule. Students will no longer receive automatic tests
            from it.
          </div>
          <HelpText>
            If you only want to pause it, edit the schedule and toggle it inactive instead.
          </HelpText>
        </div>
      ) : (
        <div className="text-sm text-[hsl(var(--muted-fg))]">No schedule selected.</div>
      )}
    </Modal>
  );
}
