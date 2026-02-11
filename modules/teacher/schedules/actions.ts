import type {
  ClassroomSchedulesResponse,
  CreateScheduleArgs,
  ScheduleDTO,
  UpdateScheduleArgs,
} from '@/types';
import { ApiErrorShape, getApiErrorMessage } from '@/utils';

function isScheduleDTO(value: unknown): value is ScheduleDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'number';
}

function extractScheduleDTO(json: unknown): ScheduleDTO | null {
  if (isScheduleDTO(json)) return json;

  if (json && typeof json === 'object') {
    const v = json as Record<string, unknown>;
    if (isScheduleDTO(v.schedule)) return v.schedule;
    if (isScheduleDTO(v.data)) return v.data;
  }

  return null;
}

export async function fetchSchedules(classroomId: number): Promise<ScheduleDTO[]> {
  const res = await fetch(`/api/classrooms/${classroomId}/schedules`, {
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

  return Array.isArray((json as ClassroomSchedulesResponse | null)?.schedules)
    ? (json as ClassroomSchedulesResponse).schedules
    : [];
}

export async function createScheduleApi(args: CreateScheduleArgs): Promise<ScheduleDTO> {
  const res = await fetch(`/api/classrooms/${args.classroomId}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json as ApiErrorShape | null, 'Failed to create schedule'));
  }

  const dto = extractScheduleDTO(json);
  if (!dto) {
    // Server succeeded but didn’t return a schedule payload you can use
    throw new Error('Schedule was created, but response payload was missing.');
  }

  return dto;
}

export async function updateScheduleApi(
  classroomId: number,
  args: UpdateScheduleArgs,
): Promise<ScheduleDTO> {
  const res = await fetch(`/api/classrooms/${classroomId}/schedules/${args.id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json as ApiErrorShape | null, 'Failed to update schedule'));
  }

  const dto = extractScheduleDTO(json);
  if (!dto) {
    throw new Error('Schedule was updated, but response payload was missing.');
  }

  return dto;
}

export async function deleteScheduleApi(classroomId: number, id: number): Promise<void> {
  const res = await fetch(`/api/classrooms/${classroomId}/schedules/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (res.status === 204) return;

  const json = (await res.json().catch(() => null)) as ApiErrorShape | null;
  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to delete schedule'));
  }
}
