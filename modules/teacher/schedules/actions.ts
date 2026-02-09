import type {
  ClassroomSchedulesResponse,
  CreateScheduleArgs,
  ScheduleDTO,
  UpdateScheduleArgs,
} from '@/types';
import { ApiErrorShape, getApiErrorMessage } from '@/utils';

export async function fetchSchedules(classroomId: number): Promise<ScheduleDTO[]> {
  const res = await fetch(`/api/classrooms/${classroomId}/schedules`, {
    cache: 'no-store',
    credentials: 'include',
  });
  const json = (await res.json().catch(() => null)) as ClassroomSchedulesResponse | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to load schedules'));
  }

  return Array.isArray(json?.schedules) ? json.schedules : [];
}

export async function createScheduleApi(args: CreateScheduleArgs): Promise<ScheduleDTO> {
  const res = await fetch(`/api/classrooms/${args.classroomId}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });

  const json = (await res.json().catch(() => null)) as ScheduleDTO | ApiErrorShape | null;
  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to create schedule'));
  }

  if (!json || typeof (json as ScheduleDTO).id !== 'number') {
    throw new Error('Failed to create schedule');
  }

  return json as ScheduleDTO;
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

  const json = (await res.json().catch(() => null)) as ScheduleDTO | ApiErrorShape | null;
  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to update schedule'));
  }

  if (!json || typeof (json as ScheduleDTO).id !== 'number') {
    throw new Error('Failed to update schedule');
  }

  return json as ScheduleDTO;
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
