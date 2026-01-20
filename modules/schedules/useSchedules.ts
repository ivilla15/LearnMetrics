'use client';

import * as React from 'react';
import type { ScheduleDTO } from '@/core/schedules/service';

type CreateScheduleInput = {
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
  numQuestions: number;
};

type UpdateScheduleInput = Partial<CreateScheduleInput>;

export function useSchedules(classroomId: number, initial?: unknown) {
  const [schedules, setSchedules] = React.useState<ScheduleDTO[]>(() =>
    Array.isArray(initial) ? (initial as ScheduleDTO[]) : [],
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/schedules`, {
        cache: 'no-store',
        credentials: 'include',
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load schedules');
      }

      setSchedules(Array.isArray(json?.schedules) ? (json.schedules as ScheduleDTO[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  async function createSchedule(input: CreateScheduleInput) {
    setError(null);

    const res = await fetch(`/api/classrooms/${classroomId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to create schedule');
    }

    await reload();
    return json;
  }

  async function updateSchedule(scheduleId: number, input: UpdateScheduleInput) {
    setError(null);
    const res = await fetch(`/api/classrooms/${classroomId}/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to update schedule');
    }
    await reload();
    return json;
  }

  async function deleteSchedule(scheduleId: number) {
    setError(null);
    const res = await fetch(`/api/classrooms/${classroomId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to delete schedule');
    }
    await reload();
    return json;
  }

  return {
    schedules,
    loading,
    error,
    reload,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
