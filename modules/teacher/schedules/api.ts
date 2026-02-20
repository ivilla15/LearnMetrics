import { getApiErrorMessage } from '@/utils/http';

type ApiErrorShape = { error?: unknown };

async function parseJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

export async function cancelOccurrenceApi(
  classroomId: number,
  scheduleId: number,
  runDate: string,
  reason?: string,
) {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedule-runs/skip`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduleId, runDate, reason }),
  });

  if (!res.ok) {
    const json = (await parseJsonSafe(res)) as ApiErrorShape | null;
    throw new Error(getApiErrorMessage(json, 'Failed to cancel occurrence'));
  }

  return parseJsonSafe(res);
}

export async function unskipOccurrenceApi(
  classroomId: number,
  scheduleId: number,
  runDate: string,
) {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedule-runs/unskip`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduleId, runDate }),
  });

  if (!res.ok) {
    const json = (await parseJsonSafe(res)) as ApiErrorShape | null;
    throw new Error(getApiErrorMessage(json, 'Failed to unskip occurrence'));
  }

  return parseJsonSafe(res);
}
