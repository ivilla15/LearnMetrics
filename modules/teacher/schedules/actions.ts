import type { ClassroomSchedulesResponse, ScheduleDTO } from '@/types';
import type { UpsertScheduleInput } from '@/validation';
import { getApiErrorMessage, type ApiErrorShape } from '@/utils';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isScheduleDTO(value: unknown): value is ScheduleDTO {
  if (!isRecord(value)) return false;
  return typeof value.id === 'number' && typeof value.classroomId === 'number';
}

function extractSchedule(json: unknown): ScheduleDTO | null {
  if (isScheduleDTO(json)) return json;

  if (isRecord(json)) {
    const maybeSchedule = json.schedule;
    if (isScheduleDTO(maybeSchedule)) return maybeSchedule;
  }

  return null;
}

export async function fetchSchedules(classroomId: number): Promise<ScheduleDTO[]> {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedules`, {
    cache: 'no-store',
    credentials: 'include',
  });

  const json = (await res.json().catch(() => null)) as
    | ClassroomSchedulesResponse
    | ApiErrorShape
    | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to load schedules'));
  }

  const schedules = (json as ClassroomSchedulesResponse | null)?.schedules;
  return Array.isArray(schedules) ? schedules : [];
}

export async function createScheduleApi(
  classroomId: number,
  input: UpsertScheduleInput,
): Promise<ScheduleDTO> {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json as ApiErrorShape | null, 'Failed to create schedule'));
  }

  const dto = extractSchedule(json);
  if (!dto) {
    throw new Error('Schedule was created, but response payload was missing.');
  }

  return dto;
}

export async function updateScheduleApi(
  classroomId: number,
  scheduleId: number,
  input: UpsertScheduleInput,
): Promise<ScheduleDTO> {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedules/${scheduleId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json as ApiErrorShape | null, 'Failed to update schedule'));
  }

  const dto = extractSchedule(json);
  if (!dto) {
    throw new Error('Schedule was updated, but response payload was missing.');
  }

  return dto;
}

export async function deleteScheduleApi(classroomId: number, scheduleId: number): Promise<void> {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedules/${scheduleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (res.status === 204) return;

  const json = (await res.json().catch(() => null)) as ApiErrorShape | null;
  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to delete schedule'));
  }
}
