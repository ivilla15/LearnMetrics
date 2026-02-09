'use client';

import { useState } from 'react';
import { Button, Input, Label, HelpText, Modal } from '@/components';
import { clampClassroomName } from '@/core/classrooms/validation';

type Props = {
  createAction: (formData: FormData) => Promise<void>;
};

export function NewClassroomButton({ createAction }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        onClick={() => {
          setName('');
          setError(null);
          setOpen(true);
        }}
      >
        + New classroom
      </Button>

      <Modal
        title="Create a classroom"
        description="Keep names short so they print nicely on login cards."
        open={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={async (fd) => {
            const parsed = clampClassroomName(name);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            setError(null);

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
            fd.set('timeZone', String(tz));
            fd.set('name', parsed.name);

            await createAction(fd);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="new-name">Classroom name</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Example: Period 1"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'new-name-error' : 'new-name-help'}
            />
            <HelpText id="new-name-help">Max 80 characters.</HelpText>
            {error ? (
              <div id="new-name-error" className="text-xs text-[hsl(var(--danger))]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
