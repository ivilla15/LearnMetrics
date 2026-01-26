'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  HelpText,
  pill,
  useToast,
} from '@/components';
import type { ScheduleDTO } from '@/core/schedules/service';
import { useSchedules } from './useSchedules';
import { ScheduleFormModal } from './ScheduleFormModal';
import { formatTimeAmPm } from '@/utils/time';

function scheduleSummary(s: ScheduleDTO) {
  const days = Array.isArray(s.days) ? s.days.join(', ') : '—';
  return `${days} • ${formatTimeAmPm(s.opensAtLocalTime)} • ${s.numQuestions} Q • ${s.windowMinutes} min`;
}

export function SchedulesClient({
  classroomId,
  initial,
}: {
  classroomId: number;
  initial?: ScheduleDTO[];
}) {
  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule } = useSchedules(
    classroomId,
    initial,
  );

  const active = schedules.filter((s) => s.isActive);
  const inactive = schedules.filter((s) => !s.isActive);
  const toast = useToast();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');
  const [editing, setEditing] = React.useState<ScheduleDTO | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function openCreate() {
    setMode('create');
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: ScheduleDTO) {
    setMode('edit');
    setEditing(s);
    setFormError(null);
    setModalOpen(true);
  }

  async function onSubmit(input: {
    opensAtLocalTime: string;
    windowMinutes: number;
    isActive: boolean;
    days: string[];
    numQuestions: number;
  }) {
    setBusy(true);
    setFormError(null);
    try {
      if (mode === 'edit' && editing) {
        await updateSchedule(editing.id, input);
        toast('Successfully edited schedule', 'success');
      } else {
        await createSchedule(input);
        toast('Successfully created schedule', 'success');
      }
      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save schedule');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    const ok = confirm('Delete this schedule?');
    if (!ok) return;

    try {
      await deleteSchedule(id);
      toast('Successfully deleted schedule', 'success');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete schedule');
    }
  }

  return (
    <div className="space-y-6">
      {/* Active schedules */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Active schedules</CardTitle>
              <CardDescription>These schedules are currently running.</CardDescription>
            </div>

            <Button variant="primary" onClick={openCreate}>
              Create schedule
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
          ) : active.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No active schedules.</div>
          ) : (
            active.map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {pill('Active', 'success')}
                      {pill(Array.isArray(s.days) ? s.days.join(', ') : '—', 'muted')}
                      {pill(formatTimeAmPm(s.opensAtLocalTime), 'muted')}
                    </div>

                    <div className="text-sm text-[hsl(var(--muted-fg))]">{scheduleSummary(s)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <HelpText>
            Tip: you can create multiple schedules (e.g., Tue/Thu practice + Fri test). Keep only
            what you want active.
          </HelpText>
        </CardContent>
      </Card>

      {/* Inactive schedules */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Inactive schedules</CardTitle>
          <CardDescription>Saved schedules that are currently turned off.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
          ) : inactive.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No inactive schedules.</div>
          ) : (
            inactive.map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {pill('Inactive', 'warning')}
                      {pill(`${s.days.join(', ')}`, 'muted')}
                      {pill(formatTimeAmPm(s.opensAtLocalTime), 'muted')}
                    </div>

                    <div className="text-sm text-[hsl(var(--muted-fg))]">{scheduleSummary(s)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ScheduleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={mode}
        initial={editing}
        busy={busy}
        error={formError}
        onSubmit={onSubmit}
      />
    </div>
  );
}
