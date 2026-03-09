'use client';

import * as React from 'react';
import type { StudentAssignmentListItemDTO } from '@/types';
import { listStudentAssignments } from '../actions';

export function useStudentAssignmentsFeed(scope: 'today' | 'all') {
  const [rows, setRows] = React.useState<StudentAssignmentListItemDTO[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingMore, setLoadingMore] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await listStudentAssignments({ scope, cursor: null, limit: 20 });
        if (cancelled) return;
        setRows(res.rows);
        setNextCursor(res.nextCursor);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listStudentAssignments({ scope, cursor: nextCursor, limit: 20 });
      setRows((prev) => [...prev, ...res.rows]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return { rows, nextCursor, loading, loadingMore, loadMore };
}
