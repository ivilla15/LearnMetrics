'use client';

import { fromZonedTime } from 'date-fns-tz';
import type { CalendarItemRow, CalendarAssignmentDTO, CalendarProjectionRow } from '@/types';
import { isProjection, parseNumberOrUndefined } from '@/utils/calendar';
import { cancelOccurrenceApi } from '@/app/api/_shared/schedules';

export async function saveCalendarItemEdit(params: {
  classroomId: number;
  item: CalendarItemRow;
  tz: string;

  editLocalDate: string; // yyyy-MM-dd
  editLocalTime: string; // HH:mm
  editWindowMinutes: string; // text input
  editNumQuestions: string; // text input
}) {
  const { classroomId, item, tz, editLocalDate, editLocalTime } = params;

  const local = new Date(`${editLocalDate}T${editLocalTime}:00`);
  const opensAtUtc = fromZonedTime(local, tz);

  const parsedWindow = parseNumberOrUndefined(params.editWindowMinutes);
  if (parsedWindow !== undefined && (parsedWindow < 0 || parsedWindow > 180)) {
    throw new Error('Window minutes must be a number between 0 and 180');
  }

  const nq = parseNumberOrUndefined(params.editNumQuestions);
  if (nq !== undefined && (nq < 1 || nq > 60)) {
    throw new Error('Num questions must be a number between 1 and 60');
  }

  const windowToUse = parsedWindow ?? item.windowMinutes ?? 4;
  const closesAtUtc = new Date(opensAtUtc.getTime() + windowToUse * 60 * 1000);

  const baseBody: Record<string, unknown> = {
    opensAt: opensAtUtc.toISOString(),
    closesAt: closesAtUtc.toISOString(),
    windowMinutes: windowToUse,
  };
  if (nq !== undefined) baseBody.numQuestions = nq;

  let res: Response;

  if (isProjection(item)) {
    const proj = item as CalendarProjectionRow;

    // When creating from a projection, the schedule generates a TEST by default for now.
    // We send the new "type" and "mode" fields per the updated schema.
    const payload: Record<string, unknown> = {
      ...baseBody,
      scheduleId: proj.scheduleId,
      runDate: proj.runDate,
      mode: 'SCHEDULED',
      type: 'TEST',
    };

    res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } else {
    const a = item as CalendarAssignmentDTO;

    res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments/${a.assignmentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(baseBody),
    });
  }

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const msg = typeof json?.error === 'string' ? json.error : 'Failed to save';
    throw new Error(msg);
  }
}

export async function cancelCalendarItemOccurrence(params: {
  classroomId: number;
  item: CalendarItemRow;
}) {
  const { classroomId, item } = params;

  if (isProjection(item)) {
    await cancelOccurrenceApi(classroomId, item.scheduleId, item.runDate);
    return;
  }

  const scheduleId = item.scheduleId ?? null;
  const runDate = item.runDate ?? null;

  if (!scheduleId || !runDate) {
    throw new Error('This assignment is not tied to a schedule occurrence.');
  }

  await cancelOccurrenceApi(classroomId, scheduleId, runDate);
}