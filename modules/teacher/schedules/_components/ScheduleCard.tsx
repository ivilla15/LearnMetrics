'use client';

import * as React from 'react';
import { Button, Pill } from '@/components';
import type { ScheduleDTO } from '@/types';
import { formatTimeAmPm } from '@/utils/time';

function scheduleSummary(s: ScheduleDTO) {
  const days = Array.isArray(s.days) && s.days.length > 0 ? s.days.join(', ') : '—';
  const time = formatTimeAmPm(s.opensAtLocalTime);

  if (s.targetKind === 'PRACTICE_TIME') {
    const mins = s.durationMinutes ?? s.windowMinutes;
    const op = s.operation ? `${s.operation} • ` : '';
    return `${days} • ${time} • ${op}${mins} min`;
  }

  const kind = s.type ?? 'TEST';
  const op = s.operation ? `${s.operation} • ` : '';
  return `${days} • ${time} • ${kind} • ${op}${s.numQuestions} Q • ${s.windowMinutes} min`;
}

export function ScheduleCard(props: {
  schedule: ScheduleDTO;
  onEdit: (s: ScheduleDTO) => void;
  onDelete: (s: ScheduleDTO) => void;
}) {
  const { schedule: s, onEdit, onDelete } = props;

  const kindLabel = s.targetKind === 'PRACTICE_TIME' ? 'Practice' : (s.type ?? 'Test');
  const durationLabel =
    s.targetKind === 'PRACTICE_TIME' ? String(s.durationMinutes ?? s.windowMinutes) : null;

  return (
    <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            {s.isActive ? Pill('Active', 'success') : Pill('Inactive', 'warning')}
            {Pill(kindLabel, 'primary')}
            {s.operation ? Pill(s.operation, 'muted') : null}
            {Pill(Array.isArray(s.days) && s.days.length ? s.days.join(', ') : '—', 'muted')}
            {Pill(formatTimeAmPm(s.opensAtLocalTime), 'muted')}
            {durationLabel ? Pill(`${durationLabel} min`, 'muted') : null}
          </div>

          <div className="text-sm text-[hsl(var(--muted-fg))] break-words">
            {scheduleSummary(s)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="secondary" size="sm" onClick={() => onEdit(s)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(s)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
