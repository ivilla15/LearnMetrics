'use client';

import * as React from 'react';
import { useToast } from '@/components';

import type { ScheduleDTO, ScheduleGate } from '@/types';
import type { UpsertScheduleInput } from '@/validation/assignmentSchedules.schema';

import {
  GateBanner,
  SchedulesListCard,
  DeleteScheduleModal,
  ScheduleFormModal,
} from './_components';
import { useSchedules } from './hooks';

export function SchedulesClient(props: {
  classroomId: number;
  initial?: ScheduleDTO[];
  gate: ScheduleGate;
}) {
  const { classroomId, initial, gate } = props;

  const toast = useToast();
  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule } = useSchedules(
    classroomId,
    initial,
  );

  const active = React.useMemo(() => schedules.filter((s) => s.isActive), [schedules]);
  const inactive = React.useMemo(() => schedules.filter((s) => !s.isActive), [schedules]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');
  const [editing, setEditing] = React.useState<ScheduleDTO | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ScheduleDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const canCreate = gate.ok;

  function openCreate() {
    if (!canCreate) {
      toast(gate.message, 'error');
      return;
    }
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

  function openDelete(s: ScheduleDTO) {
    setDeleteTarget(s);
    setDeleteOpen(true);
  }

  async function onSubmit(input: UpsertScheduleInput) {
    setBusy(true);
    setFormError(null);

    try {
      if (mode === 'create') {
        if (!canCreate) {
          setFormError(gate.message);
          toast(gate.message, 'error');
          return;
        }
        await createSchedule(input);
        toast('Successfully created schedule', 'success');
      } else {
        if (!editing) return;
        await updateSchedule(editing.id, input);
        toast('Successfully edited schedule', 'success');
      }

      setModalOpen(false);
      setEditing(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save schedule';
      setFormError(msg);
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(scheduleId: number) {
    setDeleteBusy(true);
    try {
      await deleteSchedule(scheduleId);
      toast('Successfully deleted schedule', 'success');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to delete schedule', 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <GateBanner gate={gate} />

      <SchedulesListCard
        title="Active schedules"
        description="These schedules are currently running."
        schedules={active}
        loading={loading}
        gate={gate}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
        showTip={true}
      />

      <SchedulesListCard
        title="Inactive schedules"
        description="Saved schedules that are currently turned off."
        schedules={inactive}
        loading={loading}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <ScheduleFormModal
        open={modalOpen}
        onClose={() => {
          if (!busy) setModalOpen(false);
        }}
        mode={mode}
        initial={editing}
        busy={busy}
        error={formError}
        onSubmit={onSubmit}
      />

      <DeleteScheduleModal
        open={deleteOpen}
        schedule={deleteTarget}
        busy={deleteBusy}
        onClose={() => {
          if (!deleteBusy) {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
