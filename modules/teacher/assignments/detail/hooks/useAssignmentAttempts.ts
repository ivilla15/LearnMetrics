'use client';

import * as React from 'react';
import type { AssignmentAttemptsFilter, TeacherAssignmentAttemptsResponse } from '@/types';
import { fetchAssignmentAttempts } from '../actions';

type AssignmentSummary = TeacherAssignmentAttemptsResponse['assignment'];

export function useAssignmentAttempts(params: {
  classroomId: number;
  assignmentId: number;
  initial: TeacherAssignmentAttemptsResponse;
}) {
  const { classroomId, assignmentId, initial } = params;

  const [data, setData] = React.useState<TeacherAssignmentAttemptsResponse>(initial);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<AssignmentAttemptsFilter>('ALL');

  const rows = React.useMemo(() => {
    return Array.isArray(data?.rows) ? data.rows : [];
  }, [data?.rows]);
  const assignment: AssignmentSummary | null = data?.assignment ?? null;

  const counts = React.useMemo(() => {
    const totalStudents = rows.length;
    const attemptedCount = rows.filter((r) => r.attemptId !== null).length;
    const masteryCount = rows.filter((r) => r.wasMastery === true).length;
    const missingCount = rows.filter((r) => r.attemptId === null).length;
    return { totalStudents, attemptedCount, masteryCount, missingCount };
  }, [rows]);

  async function reload(next: AssignmentAttemptsFilter) {
    setLoading(true);
    try {
      const nextData = await fetchAssignmentAttempts({
        classroomId,
        assignmentId,
        filter: next,
      });
      setData(nextData);
      setFilter(next);
    } finally {
      setLoading(false);
    }
  }

  return {
    data,
    rows,
    assignment,
    counts,

    filter,
    setFilter,
    loading,
    reload,
  } as const;
}
