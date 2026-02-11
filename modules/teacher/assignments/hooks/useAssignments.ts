'use client';

import * as React from 'react';
import type {
  AssignmentStatusFilter,
  TeacherAssignmentListItem,
  TeacherAssignmentsListResponse,
} from '@/types';
import { fetchAssignments } from '../actions';

const PAGE_LIMIT = 20;

export function useAssignments(initial: TeacherAssignmentsListResponse, classroomId: number) {
  const [data, setData] = React.useState<TeacherAssignmentsListResponse>(initial);
  const [status, setStatus] = React.useState<AssignmentStatusFilter>('all');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const rows = React.useMemo<TeacherAssignmentListItem[]>(
    () => (Array.isArray(data?.rows) ? data.rows : []),
    [data?.rows],
  );

  const recent = React.useMemo(() => rows.slice(0, 3), [rows]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((a) => {
      const hay =
        `${a.assignmentId} ${a.kind} ${a.assignmentMode} ${a.opensAt} ${a.closesAt}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  async function reload(nextStatus: AssignmentStatusFilter) {
    setLoading(true);
    try {
      const next = await fetchAssignments({
        classroomId,
        status: nextStatus,
        limit: PAGE_LIMIT,
      });
      setData(next);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!data.nextCursor) return;
    setLoading(true);
    try {
      const next = await fetchAssignments({
        classroomId,
        status,
        limit: PAGE_LIMIT,
        cursor: data.nextCursor,
      });

      setData((prev) => ({
        ...prev,
        rows: [...(prev.rows ?? []), ...(next.rows ?? [])],
        nextCursor: next.nextCursor ?? null,
      }));
    } finally {
      setLoading(false);
    }
  }

  function onChangeStatus(next: AssignmentStatusFilter) {
    setStatus(next);
    setSearch('');
    void reload(next);
  }

  return {
    data,
    status,
    search,
    loading,

    rows,
    recent,
    filteredRows,

    setSearch,
    onChangeStatus,
    reload,
    loadMore,
  } as const;
}
