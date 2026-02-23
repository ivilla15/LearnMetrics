'use client';

import * as React from 'react';
import { Modal, Button, Input, Label, HelpText } from '@/components';
import {
  WEEKDAYS,
  type AssignmentTargetKind,
  type AssignmentType,
  type ScheduleDTO,
} from '@/types';
import type { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';
import { formatTimeAmPm } from '@/utils/time';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';

  initial?: ScheduleDTO | null;

  busy: boolean;
  error: string | null;

  onSubmit: (input: UpsertScheduleInput) => void | Promise<void>;
};

const WEEKDAY_LABELS: Record<(typeof WEEKDAYS)[number], string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
};

const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  TEST: 'Test',
  PRACTICE: 'Practice',
  REMEDIATION: 'Remediation',
  PLACEMENT: 'Placement',
};

export function ScheduleFormModal({ open, onClose, mode, initial, busy, error, onSubmit }: Props) {
  const [targetKind, setTargetKind] = React.useState<AssignmentTargetKind>('ASSESSMENT');
  const [opensAtLocalTime, setOpensAtLocalTime] = React.useState('08:00');
  const [isActive, setIsActive] = React.useState(true);
  const [days, setDays] = React.useState<Array<(typeof WEEKDAYS)[number]>>(['Friday']);

  const [windowMinutes, setWindowMinutes] = React.useState(4);
  const [numQuestions, setNumQuestions] = React.useState(12);
  const [type, setType] = React.useState<AssignmentType>('TEST');

  const [durationMinutes, setDurationMinutes] = React.useState(10);

  React.useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initial) {
      setTargetKind(initial.targetKind);

      const t = initial.opensAtLocalTime ?? '08:00';
      setOpensAtLocalTime(t.length >= 5 ? t.slice(0, 5) : '08:00');

      setIsActive(Boolean(initial.isActive));

      const weekdaySet = new Set<(typeof WEEKDAYS)[number]>(WEEKDAYS);

      const initialDays =
        Array.isArray(initial.days) && initial.days.length > 0
          ? initial.days
          : (['Friday'] as (typeof WEEKDAYS)[number][]);

      setDays(
        initialDays.filter((d): d is (typeof WEEKDAYS)[number] =>
          weekdaySet.has(d as (typeof WEEKDAYS)[number]),
        ),
      );

      if (initial.targetKind === 'ASSESSMENT') {
        setWindowMinutes(initial.windowMinutes ?? 4);
        setNumQuestions(initial.numQuestions ?? 12);
        setType(initial.type ?? 'TEST');
        setDurationMinutes(initial.durationMinutes ?? 10);
      } else {
        setDurationMinutes(initial.durationMinutes ?? 10);
        setWindowMinutes(initial.windowMinutes ?? 4);
        setNumQuestions(initial.numQuestions ?? 12);
        setType(initial.type ?? 'TEST');
      }
    } else {
      setTargetKind('ASSESSMENT');
      setOpensAtLocalTime('08:00');
      setIsActive(true);
      setDays(['Friday']);

      setWindowMinutes(4);
      setNumQuestions(12);
      setType('TEST');

      setDurationMinutes(10);
    }
  }, [open, mode, initial]);
  function toggleDay(key: (typeof WEEKDAYS)[number]) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  }

  const title = mode === 'edit' ? 'Edit schedule' : 'Create schedule';

  const description =
    targetKind === 'ASSESSMENT'
      ? mode === 'edit'
        ? 'Update when assessments open, which days run, and how long students have.'
        : 'Add a new schedule for automatic assessments in this classroom.'
      : mode === 'edit'
        ? 'Update when practice opens, which days run, and how long students practice.'
        : 'Add a new schedule for timed practice in this classroom.';

  function buildSubmitInput(): UpsertScheduleInput {
    const safeDays = days.length > 0 ? days : (['Friday'] as const);

    if (targetKind === 'ASSESSMENT') {
      return {
        targetKind: 'ASSESSMENT',
        opensAtLocalTime,
        windowMinutes,
        isActive,
        days: safeDays as unknown as string[],
        type,
        numQuestions,
        operation: initial?.operation ?? null,
        dependsOnScheduleId: initial?.dependsOnScheduleId ?? null,
        offsetMinutes: initial?.offsetMinutes ?? 0,
        recipientRule: initial?.recipientRule ?? 'ALL',
      };
    }

    return {
      targetKind: 'PRACTICE_TIME',
      opensAtLocalTime,
      windowMinutes: initial?.windowMinutes ?? 4,
      isActive,
      days: safeDays as unknown as string[],
      durationMinutes,
      operation: initial?.operation ?? null,
      dependsOnScheduleId: initial?.dependsOnScheduleId ?? null,
      offsetMinutes: initial?.offsetMinutes ?? 0,
      recipientRule: initial?.recipientRule ?? 'ALL',
    };
  }

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
              onSubmit(buildSubmitInput());
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

        {/* Kind */}
        <div className="rounded-[18px] bg-[hsl(var(--surface))] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Schedule type</div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTargetKind('ASSESSMENT')}
              className={[
                'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                targetKind === 'ASSESSMENT'
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              Assessment
            </button>

            <button
              type="button"
              onClick={() => setTargetKind('PRACTICE_TIME')}
              className={[
                'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                targetKind === 'PRACTICE_TIME'
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              Practice time
            </button>
          </div>

          <div className="mt-3">
            <HelpText>
              Assessment schedules create graded assignments. Practice-time schedules open a timed
              practice session.
            </HelpText>
          </div>
        </div>

        {/* Days */}
        <div className="rounded-[18px] bg-[hsl(var(--surface))] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Days</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={[
                    'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                  ].join(' ')}
                >
                  {WEEKDAY_LABELS[d]}
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

            {targetKind === 'ASSESSMENT' ? (
              <div className="grid gap-1">
                <Label htmlFor="windowMinutes">Time limit (minutes)</Label>
                <Input
                  id="windowMinutes"
                  inputMode="numeric"
                  value={String(windowMinutes)}
                  onChange={(e) => setWindowMinutes(Number(e.target.value) || 0)}
                />
              </div>
            ) : (
              <div className="grid gap-1">
                <Label htmlFor="durationMinutes">Practice duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  inputMode="numeric"
                  value={String(durationMinutes)}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
                />
              </div>
            )}

            {targetKind === 'ASSESSMENT' ? (
              <div className="grid gap-1">
                <Label htmlFor="assignmentType">Assignment type</Label>
                <select
                  id="assignmentType"
                  value={type}
                  onChange={(e) => setType(e.target.value as AssignmentType)}
                  className="h-10 rounded-[10px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm text-[hsl(var(--fg))]"
                >
                  {(['TEST', 'PRACTICE', 'REMEDIATION', 'PLACEMENT'] as const).map((t) => (
                    <option key={t} value={t}>
                      {ASSIGNMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {targetKind === 'ASSESSMENT' ? (
              <div className="grid gap-1">
                <Label htmlFor="numQuestions">Questions</Label>
                <Input
                  id="numQuestions"
                  inputMode="numeric"
                  value={String(numQuestions)}
                  onChange={(e) => setNumQuestions(Number(e.target.value) || 0)}
                />
              </div>
            ) : null}

            <div className="grid gap-1 sm:col-span-2">
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

            {targetKind === 'PRACTICE_TIME' ? (
              <div className="sm:col-span-2">
                <HelpText>
                  Practice-time schedules do not create graded attempts. They open a timed practice
                  session for students.
                </HelpText>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
