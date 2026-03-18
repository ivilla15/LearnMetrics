'use client';

import * as React from 'react';
import { Button, HelpText, Label } from '@/components';

export function BulkAddPanel(props: {
  value: string;
  onChange: (v: string) => void;

  error: string | null;

  busy: boolean;

  onCancel: () => void;
  onSave: () => void;
}) {
  const { value, onChange, error, busy, onCancel, onSave } = props;

  return (
    <div className="rounded-[28px] bg-[hsl(var(--surface-2))] p-5 space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-[hsl(var(--fg))]">Add multiple students</div>
        <HelpText>
          One student per line. Optionally append a level and starting operation:
          <code> First Last, 5, DIV</code>
        </HelpText>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bulk-names">Student names</Label>
        <textarea
          id="bulk-names"
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-(--radius) bg-[hsl(var(--surface))] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          placeholder={`Ada Lovelace\nAlan Turing, 5, DIV\nGrace Hopper, 12, MUL\nKatherine Johnson, 1, ADD`}
        />
        {error ? <div className="text-xs text-[hsl(var(--danger))]">{error}</div> : null}
        <HelpText>
          One student per line. Optional format: <code>First Last, level, operation</code>.
          Operations: <code>ADD</code>, <code>SUB</code>, <code>MUL</code>, <code>DIV</code>.
        </HelpText>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : 'Add students'}
        </Button>
      </div>
    </div>
  );
}
