'use client';

import * as React from 'react';
import type { CreateScheduleArgs, ScheduleDTO, UpdateScheduleArgs } from '@/types';
import {
  fetchSchedules,
  createScheduleApi,
  updateScheduleApi,
  deleteScheduleApi,
} from '../actions';

function normalizeSchedules(list: ScheduleDTO[]): ScheduleDTO[] {
  return Array.isArray(list) ? list : [];
}

export function useSchedules(classroomId: number, initial?: ScheduleDTO[]) {
  const [schedules, setSchedules] = React.useState<ScheduleDTO[]>(() =>
    normalizeSchedules(initial ?? []),
  );
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchSchedules(classroomId);
      setSchedules(next);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  const createSchedule = React.useCallback(
    async (input: Omit<CreateScheduleArgs, 'classroomId'>) => {
      setLoading(true);
      try {
        const created = await createScheduleApi({ classroomId, ...input });
        setSchedules((prev) => [created, ...prev]);
        return created;
      } finally {
        setLoading(false);
      }
    },
    [classroomId],
  );

  const updateSchedule = React.useCallback(
    async (id: number, input: Omit<UpdateScheduleArgs, 'id'>) => {
      setLoading(true);
      try {
        const updated = await updateScheduleApi(classroomId, { id, ...input });
        setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [classroomId],
  );

  const deleteSchedule = React.useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        await deleteScheduleApi(classroomId, id);
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      } finally {
        setLoading(false);
      }
    },
    [classroomId],
  );

  return {
    schedules,
    loading,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } as const;
}
