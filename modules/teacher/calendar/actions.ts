'use client';

import { fromZonedTime } from 'date-fns-tz';
import {
  type CalendarAssignmentRowDTO,
  type CalendarItemRowDTO,
  type CalendarProjectionRowDTO,
} from '@/types';
import { parseNumberOrUndefined, isProjection } from '@/utils';

async function skipOccurrenceApi(params: {
  classroomId: number;
  scheduleId: number;
  runDate: string;
  reason?: string;
}) {
  const res = await fetch(`/api/teacher/classrooms/${params.classroomId}/schedule-runs/skip`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      scheduleId: params.scheduleId,
      runDate: params.runDate,
      reason: params.reason,
    }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const msg = typeof json?.error === 'string' ? json.error : 'Failed to cancel occurrence';
    throw new Error(msg);
  }
}

export async function saveCalendarItemEdit(params: {
  classroomId: number;
  item: CalendarItemRowDTO;
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

  // Only meaningful for assessment items
  if (nq !== undefined) baseBody.numQuestions = nq;

  let res: Response;

  if (isProjection(item)) {
    const proj = item as CalendarProjectionRowDTO;

    // Create assignment from projection.
    // IMPORTANT: respect projection targetKind/type instead of hardcoding TEST.
    const payload: Record<string, unknown> = {
      ...baseBody,
      scheduleId: proj.scheduleId,
      runDate: proj.runDate,
      mode: proj.mode,
      targetKind: proj.targetKind,
    };

    // optional fields depending on kind
    if (proj.type) payload.type = proj.type;
    if (proj.operation) payload.operation = proj.operation;

    if (proj.targetKind === 'PRACTICE_TIME') {
      payload.durationMinutes = proj.durationMinutes ?? 0;
      // numQuestions irrelevant, but harmless if backend ignores
    } else {
      // assessment
      if (nq !== undefined) payload.numQuestions = nq;
      else if (proj.numQuestions != null) payload.numQuestions = proj.numQuestions;
      if (proj.windowMinutes != null) payload.windowMinutes = proj.windowMinutes;
    }

    res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } else {
    const a = item as CalendarAssignmentRowDTO;

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
  item: CalendarItemRowDTO;
}) {
  const { classroomId, item } = params;

  if (isProjection(item)) {
    await skipOccurrenceApi({ classroomId, scheduleId: item.scheduleId, runDate: item.runDate });
    return;
  }

  const scheduleId = item.scheduleId ?? null;
  const runDate = item.runDate ?? null;

  if (!scheduleId || !runDate) {
    throw new Error('This assignment is not tied to a schedule occurrence.');
  }

  await skipOccurrenceApi({ classroomId, scheduleId, runDate });
}
