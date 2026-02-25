'use client';

import * as React from 'react';
import { useToast } from '@/components';

import type { CalendarAssignmentsListResponse, CalendarItemRowDTO } from '@/types';
import { useCalendar } from '@/modules/teacher/calendar/hooks/useCalendar';
import { MonthGrid } from './_components';
import { AssignmentDetailsModal } from './_components/AssignmentDetailsModal';
import { EditAssignmentModal } from './_components/EditAssignmentModal';

export function CalendarClient(props: {
  classroomId: number;
  initial: CalendarAssignmentsListResponse;
}) {
  const { classroomId, initial } = props;

  const toast = useToast();

  const cal = useCalendar(initial, classroomId);

  const [selected, setSelected] = React.useState<CalendarItemRowDTO | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editLocalDate, setEditLocalDate] = React.useState('');
  const [editLocalTime, setEditLocalTime] = React.useState('');
  const [editWindowMinutes, setEditWindowMinutes] = React.useState('');
  const [editNumQuestions, setEditNumQuestions] = React.useState('');
  const [editSaving, setEditSaving] = React.useState(false);
  const [editDurationMinutes, setEditDurationMinutes] = React.useState('');

  const selectedIsProjection = !!selected && cal.isProjection(selected);

  const selectedClosed =
    selected && selected.closesAt
      ? new Date(cal.toIso(selected.closesAt)).getTime() <= Date.now()
      : false;

  const openDetails = React.useCallback(
    (item: CalendarItemRowDTO) => {
      const payload = cal.openDetailsPayloadFor(item);
      setSelected(payload.item);
      setEditLocalDate(payload.date);
      setEditLocalTime(payload.time);
      setEditWindowMinutes(item.windowMinutes == null ? '' : String(item.windowMinutes));
      setEditNumQuestions(String(item.numQuestions ?? 12));
      setDetailOpen(true);
      setEditDurationMinutes(item.durationMinutes == null ? '' : String(item.durationMinutes));
    },
    [cal],
  );

  const closeDetails = React.useCallback(() => {
    setDetailOpen(false);
    setSelected(null);
  }, []);

  async function onEditSave() {
    if (!selected) return;

    if (!editLocalDate || !editLocalTime) {
      toast('Please choose a date and time', 'error');
      return;
    }

    setEditSaving(true);
    try {
      const { saveCalendarItemEdit } = await import('@/modules/teacher/calendar/actions');

      await saveCalendarItemEdit({
        classroomId,
        item: selected,
        tz: cal.tz,
        editLocalDate,
        editLocalTime,
        editWindowMinutes,
        editNumQuestions,
        editDurationMinutes,
      });

      toast('Saved', 'success');
      setEditOpen(false);
      closeDetails();
      await cal.loadAllForMonth(cal.month);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  async function onCancelOccurrence() {
    if (!selected) return;

    try {
      const { cancelCalendarItemOccurrence } = await import('@/modules/teacher/calendar/actions');

      await cancelCalendarItemOccurrence({ classroomId, item: selected });

      toast('Cancelled occurrence', 'success');
      closeDetails();
      await cal.loadAllForMonth(cal.month);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
    }
  }

  return (
    <div>
      <MonthGrid
        month={cal.month}
        tz={cal.tz}
        loading={cal.loading}
        onPrev={() => cal.setMonth(cal.addMonths(cal.month, -1))}
        onToday={() => cal.setMonth(new Date())}
        onNext={() => cal.setMonth(cal.addMonths(cal.month, 1))}
        byDay={cal.byDay}
        onOpenDetails={openDetails}
        onOpenDayMobile={(dayKey) => {
          const items = cal.byDay.get(dayKey) ?? [];
          if (items.length === 1) openDetails(items[0]);
          else if (items.length > 1) openDetails(items[0]);
        }}
      />

      <AssignmentDetailsModal
        open={detailOpen}
        onClose={closeDetails}
        item={selected}
        tz={cal.tz}
        isProjection={selected ? cal.isProjection(selected) : false}
        isClosed={selectedClosed}
        onOpenEdit={() => setEditOpen(true)}
        onCancelOccurrence={onCancelOccurrence}
      />

      <EditAssignmentModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        tz={cal.tz}
        isProjection={selectedIsProjection}
        targetKind={selected?.targetKind ?? 'ASSESSMENT'}
        saving={editSaving}
        dateValue={editLocalDate}
        timeValue={editLocalTime}
        windowMinutesValue={editWindowMinutes}
        numQuestionsValue={editNumQuestions}
        durationMinutesValue={editDurationMinutes}
        onChangeDate={setEditLocalDate}
        onChangeTime={setEditLocalTime}
        onChangeWindowMinutes={setEditWindowMinutes}
        onChangeNumQuestions={setEditNumQuestions}
        onChangeDurationMinutes={setEditDurationMinutes}
        onSave={() => void onEditSave()}
      />
    </div>
  );
}
