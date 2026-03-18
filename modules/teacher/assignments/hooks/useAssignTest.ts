'use client';

import * as React from 'react';
import type { AssignModalStudentRowDTO } from '@/types';
import { fetchAssignModalBootstrap } from '../actions';

export function useAssignTest(classroomId: number) {
  const [open, setOpen] = React.useState(false);

  const [students, setStudents] = React.useState<AssignModalStudentRowDTO[]>([]);
  const [lastNumQuestions, setLastNumQuestions] = React.useState<number | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openModal = React.useCallback(async () => {
    setError(null);
    setOpen(true);

    if (students.length > 0) return;

    setLoading(true);
    try {
      const dto = await fetchAssignModalBootstrap({ classroomId, days: 30 });

      const nextStudents = Array.isArray(dto.students) ? dto.students : [];
      setStudents(nextStudents);

      const last = dto?.recent?.last3Tests?.[0] ?? null;
      setLastNumQuestions(typeof last?.numQuestions === 'number' ? last.numQuestions : null);
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
    lastNumQuestions,
    loading,
    error,
    openModal,
  } as const;
}
