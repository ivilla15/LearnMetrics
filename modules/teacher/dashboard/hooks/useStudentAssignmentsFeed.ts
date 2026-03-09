'use client';

import * as React from 'react';
import type { StudentAssignmentListItemDTO } from '@/types';
import { listStudentAssignments } from '../actions';

export function useStudentAssignmentsFeed(scope: 'today' | 'all') {
  const [rows, setRows] = React.useState<StudentAssignmentListItemDTO[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingOlder, setLoadingOlder] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const res = await listStudentAssignments({ scope, cursor: null, limit: 20 });
        if (cancelled) return;

        if (scope !== 'all') {
          setRows(res.rows);
          setNextCursor(res.nextCursor);
          return;
        }

        const calRes = await fetch('/api/student/calendar?status=all&limit=200', {
          cache: 'no-store',
          credentials: 'include',
        });

        let projections: unknown[] = [];
        if (calRes.ok) {
          const calJson: unknown = await calRes.json().catch(() => null);
          if (calJson && typeof calJson === 'object') {
            const rec = calJson as Record<string, unknown>;
            projections = Array.isArray(rec.projections) ? rec.projections : [];
          }
        }

        const realKeys = new Set<string>();
        for (const a of res.rows) {
          if (typeof a.scheduleId === 'number' && a.runDate) {
            realKeys.add(`${a.scheduleId}|${a.runDate}`);
          }
        }

        const filteredProjections = projections.filter((p) => {
          if (!p || typeof p !== 'object') return false;
          const rec = p as Record<string, unknown>;

          if (rec.kind !== 'projection') return false;
          if (typeof rec.scheduleId !== 'number') return false;
          if (typeof rec.runDate !== 'string') return false;

          const key = `${rec.scheduleId}|${rec.runDate.slice(0, 10)}`;
          return !realKeys.has(key);
        });

        setRows([...res.rows, ...(filteredProjections as StudentAssignmentListItemDTO[])]);
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

  async function loadOlder() {
    if (!nextCursor || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const res = await listStudentAssignments({ scope, cursor: nextCursor, limit: 20 });

      setRows((prev) => [...res.rows, ...prev]);

      setNextCursor(res.nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  }

  return { rows, nextCursor, loading, loadingOlder, loadOlder };
}
