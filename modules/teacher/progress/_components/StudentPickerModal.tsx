'use client';

import * as React from 'react';
import { Modal, Button, HelpText, Input, Label } from '@/components';

export function StudentPickerModal({
  open,
  onClose,
  search,
  setSearch,
  students,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  search: string;
  setSearch: (v: string) => void;
  students: Array<{ id: number; name: string; username: string }>;
  onPick: (studentId: number) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open student progress"
      description="Choose a student to view their detailed progress report."
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="picker-search">Search</Label>
          <Input
            id="picker-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or username…"
          />
        </div>

        <div className="max-h-90 overflow-auto rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
          {students.length === 0 ? (
            <div className="p-4 text-sm text-[hsl(var(--muted-fg))]">No matches.</div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onPick(s.id)}
                  className="w-full text-left p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors"
                >
                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">{s.name}</div>
                  <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">{s.username}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <HelpText>
          Tip: student picker is independent from the Students table search/filters.
        </HelpText>
      </div>
    </Modal>
  );
}
