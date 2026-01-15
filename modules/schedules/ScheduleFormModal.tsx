'use client';

import * as React from 'react';
import { Modal, Button, Input, Label, HelpText } from '@/components';
import type { ScheduleDTO } from '@/core/schedules/service';
import { formatTimeAmPm } from '@/utils/time';

type Mode = 'create' | 'edit';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: Mode;

  initial?: ScheduleDTO | null;

  busy: boolean;
  error: string | null;

  onSubmit: (input: {
    opensAtLocalTime: string;
    windowMinutes: number;
    isActive: boolean;
    days: string[];
    numQuestions: number;
  }) => void | Promise<void>;
};

const DAY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'Monday', label: 'Mon' },
  { key: 'Tuesday', label: 'Tue' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday', label: 'Thu' },
  { key: 'Friday', label: 'Fri' },
  { key: 'Saturday', label: 'Sat' },
  { key: 'Sunday', label: 'Sun' },
];

export function ScheduleFormModal({ open, onClose, mode, initial, busy, error, onSubmit }: Props) {
  const [opensAtLocalTime, setOpensAtLocalTime] = React.useState('08:00');
  const [windowMinutes, setWindowMinutes] = React.useState(4);
  const [numQuestions, setNumQuestions] = React.useState(12);
  const [isActive, setIsActive] = React.useState(true);
  const [days, setDays] = React.useState<string[]>(['Friday']);

  React.useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initial) {
      const t = initial.opensAtLocalTime ?? '08:00';
      setOpensAtLocalTime(t.length >= 5 ? t.slice(0, 5) : '08:00');
      setWindowMinutes(Number(initial.windowMinutes) || 4);
      setNumQuestions(Number(initial.numQuestions) || 12);
      setIsActive(!!initial.isActive);
      setDays(Array.isArray(initial.days) && initial.days.length > 0 ? initial.days : ['Friday']);
    } else {
      setOpensAtLocalTime('08:00');
      setWindowMinutes(4);
      setNumQuestions(12);
      setIsActive(true);
      setDays(['Friday']);
    }
  }, [open, mode, initial]);

  function toggleDay(key: string) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  }

  const title = mode === 'edit' ? 'Edit schedule' : 'Create schedule';
  const description =
    mode === 'edit'
      ? 'Update when tests open, which days run, and how long students have.'
      : 'Add a new schedule for automatic tests in this classroom.';

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      description={description}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => {
              onSubmit({
                opensAtLocalTime,
                windowMinutes,
                isActive,
                days,
                numQuestions,
              });
            }}
          >
            {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create schedule'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[14px] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm text-[hsl(var(--danger))]">
            {error}
          </div>
        ) : null}

        {/* Days */}
        <div className="rounded-[18px] bg-[hsl(var(--surface))] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Days</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => {
              const active = days.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={[
                    'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                  ].join(' ')}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <HelpText>Pick one or more days this schedule should run.</HelpText>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Settings</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="opensAtLocalTime">Open time (local)</Label>
                <div className="text-xs text-[hsl(var(--muted-fg))]">
                  Preview:{' '}
                  <span className="font-medium text-[hsl(var(--fg))]">
                    {formatTimeAmPm(opensAtLocalTime)}
                  </span>
                </div>
              </div>

              <Input
                id="opensAtLocalTime"
                type="time"
                value={opensAtLocalTime}
                onChange={(e) => setOpensAtLocalTime(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="windowMinutes">Time limit (minutes)</Label>
              <Input
                id="windowMinutes"
                inputMode="numeric"
                value={String(windowMinutes)}
                onChange={(e) => setWindowMinutes(Number(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="numQuestions">Questions</Label>
              <Input
                id="numQuestions"
                inputMode="numeric"
                value={String(numQuestions)}
                onChange={(e) => setNumQuestions(Number(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-1">
              <Label>Active</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm text-[hsl(var(--fg))]">Schedule is active</span>
              </div>
            </div>
          </div>

          <HelpText>
            Open time uses <span className="font-medium">opensAtLocalTime</span> (e.g. 08:00). Your
            backend can interpret this per classroom timezone rules later if you want.
          </HelpText>
        </div>
      </div>
    </Modal>
  );
}
