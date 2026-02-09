'use client';

import * as React from 'react';
import type { TeacherStudentProgressDTO } from '@/core/teacher/Progress';
import { getApiErrorMessage } from '@/utils/http';

export function useStudentProgress(params: {
  classroomId: number;
  studentId: number;
  initial: TeacherStudentProgressDTO;
  printMode: boolean;
}) {
  const { classroomId, studentId, initial, printMode } = params;

  const [data, setData] = React.useState<TeacherStudentProgressDTO>(initial);
  const [loading, setLoading] = React.useState(false);
  const [daysText, setDaysText] = React.useState(String(initial.range.days ?? 30));

  React.useEffect(() => {
    if (data.range.days) setDaysText(String(data.range.days));
  }, [data.range.days]);

  const reload = React.useCallback(
    async (nextDays: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/teacher/classrooms/${classroomId}/students/${studentId}/progress?days=${nextDays}`,
          { cache: 'no-store' },
        );

        const json: TeacherStudentProgressDTO | null = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(getApiErrorMessage(json, 'Failed to load'));
        }

        if (json) setData(json);
      } finally {
        setLoading(false);
      }
    },
    [classroomId, studentId],
  );

  const applyDays = React.useCallback(() => {
    const parsed = Number(daysText);
    const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    void reload(safe);
  }, [daysText, reload]);

  React.useEffect(() => {
    if (!printMode) return;
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, [printMode]);

  return {
    data,
    setData,
    loading,
    daysText,
    setDaysText,
    applyDays,
    reload,
  } as const;
}
