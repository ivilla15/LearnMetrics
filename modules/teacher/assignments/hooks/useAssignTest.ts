'use client';

import * as React from 'react';
import type { AssignModalLastMeta, AssignModalStudentRow } from '@/types';
import { fetchAssignModalBootstrap } from '../actions';

export function useAssignTest(classroomId: number) {
  const [open, setOpen] = React.useState(false);

  const [students, setStudents] = React.useState<AssignModalStudentRow[]>([]);
  const [lastMeta, setLastMeta] = React.useState<AssignModalLastMeta | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openModal = React.useCallback(async () => {
    setError(null);
    setOpen(true);

    // already loaded
    if (students.length > 0) return;

    setLoading(true);
    try {
      const dto = await fetchAssignModalBootstrap({ classroomId, days: 30 });

      const nextStudents = Array.isArray(dto.students) ? dto.students : [];
      setStudents(nextStudents);

      const last = dto?.recent?.last3Tests?.[0] ?? null;
      setLastMeta(
        last ? { numQuestions: last.numQuestions, windowMinutes: 4, questionSetId: null } : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [classroomId, students.length]);

  return {
    open,
    setOpen,

    students,
    lastMeta,

    loading,
    error,

    openModal,
  } as const;
}
