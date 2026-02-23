'use client';

import * as React from 'react';
import type { AssignModalStudentRowDTO, TeacherAssignmentAttemptRowDTO } from '@/types';
import { fetchAssignModalBootstrap } from '../../actions';

export function useAssignMissing(params: {
  classroomId: number;
  attemptRows: TeacherAssignmentAttemptRowDTO[];
}) {
  const { classroomId, attemptRows } = params;

  const [open, setOpen] = React.useState(false);
  const [students, setStudents] = React.useState<AssignModalStudentRowDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [defaultSelectedIds, setDefaultSelectedIds] = React.useState<number[]>([]);

  async function openModal() {
    setError(null);
    setOpen(true);

    setLoading(true);
    try {
      const dto = await fetchAssignModalBootstrap({ classroomId, days: 30 });

      const roster = Array.isArray(dto.students) ? dto.students : [];
      setStudents(roster);

      const attempted = new Set(
        attemptRows.filter((r) => r.attemptId !== null).map((r) => r.studentId),
      );

      const eligible = roster.filter((s) => !s.flags?.needsSetup);
      const missingIds = eligible.filter((s) => !attempted.has(s.id)).map((s) => s.id);

      setDefaultSelectedIds(missingIds);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  return {
    open,
    setOpen,

    students,
    defaultSelectedIds,

    loading,
    error,

    openModal,
  } as const;
}
