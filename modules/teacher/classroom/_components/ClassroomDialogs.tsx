'use client';

import { useState } from 'react';
import { Button, Input, Label, HelpText, Modal } from '@/components';
import { clampClassroomName } from '@/core/classrooms/validation';
import type { TeacherClassroomCardRow } from '@/data/classrooms.repo';

export function RenameClassroomDialog({
  open,
  classroom,
  onClose,
  renameAction,
}: {
  open: boolean;
  classroom: TeacherClassroomCardRow | null;
  onClose: () => void;
  renameAction: (formData: FormData) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // keep initial value in sync when opening
  // (simple approach: set when classroom changes & open)
  if (open && classroom && value === '') {
    // intentional: only seed once per open
    // eslint-disable-next-line react/no-direct-mutation-state
  }

  return (
    <Modal
      title="Rename classroom"
      description="Keep names short so they print nicely."
      open={open}
      onClose={onClose}
    >
      {classroom ? (
        <form
          action={async (fd) => {
            const parsed = clampClassroomName(value);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            setError(null);

            fd.set('classroomId', String(classroom.id));
            fd.set('name', parsed.name);

            await renameAction(fd);
            onClose();
          }}
          className="space-y-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="rename-name">Classroom name</Label>
            <Input
              id="rename-name"
              value={value || classroom.name || ''}
              onChange={(e) => setValue(e.target.value)}
              maxLength={80}
              placeholder="Example: Period 1"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'rename-name-error' : 'rename-name-help'}
            />
            <HelpText id="rename-name-help">Max 80 characters.</HelpText>
            {error ? (
              <div id="rename-name-error" className="text-xs text-[hsl(var(--danger))]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

export function DeleteClassroomDialog({
  open,
  classroom,
  onClose,
  deleteAction,
}: {
  open: boolean;
  classroom: TeacherClassroomCardRow | null;
  onClose: () => void;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Modal
      title="Delete classroom?"
      description="This cannot be undone."
      open={open}
      onClose={onClose}
    >
      {classroom ? (
        <div className="space-y-3">
          <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] p-3 text-sm text-[hsl(var(--fg))]">
            You’re about to delete{' '}
            <span className="font-semibold">
              {classroom.name?.trim() ? classroom.name : `Classroom ${classroom.id}`}
            </span>
            .
          </div>

          <HelpText>
            Deletes this classroom and all related students, assignments, schedules, and attempts.
          </HelpText>

          <form
            action={async (fd) => {
              fd.set('classroomId', String(classroom.id));
              await deleteAction(fd);
              onClose();
            }}
            className="flex justify-end gap-2 pt-2"
          >
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      ) : null}
    </Modal>
  );
}
