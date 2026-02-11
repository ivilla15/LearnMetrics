'use client';

import * as React from 'react';
import type {
  AssignmentStatusFilter,
  TeacherAssignmentListItem,
  TeacherAssignmentsListResponse,
  AssignmentModeFilter,
  AssignmentTypeFilter,
} from '@/types';
import { fetchAssignments } from '../actions';

const PAGE_LIMIT = 20;

function matchesStatus(row: TeacherAssignmentListItem, status: AssignmentStatusFilter) {
  if (status === 'all') return true;
  if (status === 'open') return row.status === 'OPEN';
  if (status === 'upcoming') return row.status === 'UPCOMING';
  if (status === 'finished') return row.status === 'FINISHED';
  return true;
}

function matchesMode(row: TeacherAssignmentListItem, mode: AssignmentModeFilter) {
  if (mode === 'all') return true;
  return row.mode === mode;
}

function matchesType(row: TeacherAssignmentListItem, type: AssignmentTypeFilter) {
  if (type === 'all') return true;
  return row.type === type;
}

export function useAssignments(initial: TeacherAssignmentsListResponse, classroomId: number) {
  const [data, setData] = React.useState<TeacherAssignmentsListResponse>(initial);

  // product default
  const [status, setStatus] = React.useState<AssignmentStatusFilter>('finished');
  const [mode, setMode] = React.useState<AssignmentModeFilter>('all');
  const [type, setType] = React.useState<AssignmentTypeFilter>('TEST');

  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const rows = React.useMemo<TeacherAssignmentListItem[]>(
    () => (Array.isArray(data?.rows) ? data.rows : []),
    [data?.rows],
  );

  const recent = React.useMemo(() => rows.slice(0, 3), [rows]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((a) => {
      if (!matchesStatus(a, status)) return false;
      if (!matchesMode(a, mode)) return false;
      if (!matchesType(a, type)) return false;

      if (!q) return true;

      const hay = [
        a.assignmentId,
        a.type,
        a.mode,
        a.status,
        a.opensAt,
        a.closesAt ?? '',
        a.numQuestions ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search, status, mode, type]);

  async function reload(next?: {
    status?: AssignmentStatusFilter;
    mode?: AssignmentModeFilter;
    type?: AssignmentTypeFilter;
  }) {
    setLoading(true);
    try {
      const nextStatus = next?.status ?? status;
      const nextMode = next?.mode ?? mode;
      const nextType = next?.type ?? type;

      const resp = await fetchAssignments({
        classroomId,
        status: nextStatus,
        mode: nextMode,
        type: nextType,
        limit: PAGE_LIMIT,
      });

      setData(resp);
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
        mode,
        type,
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
    void reload({ status: next });
  }

  function onChangeMode(next: AssignmentModeFilter) {
    setMode(next);
    setSearch('');
    void reload({ mode: next });
  }

  function onChangeType(next: AssignmentTypeFilter) {
    setType(next);
    setSearch('');
    void reload({ type: next });
  }

  return {
    data,
    status,
    mode,
    type,
    search,
    loading,

    rows,
    recent,
    filteredRows,

    setSearch,
    onChangeStatus,
    onChangeMode,
    onChangeType,

    reload,
    loadMore,
  } as const;
}