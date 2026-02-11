'use client';

import * as React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import type {
  CalendarAssignmentsListResponse,
  CalendarAssignmentDTO,
  CalendarProjectionRow,
  CalendarItemRow,
} from '@/types';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { dayKeyInTimeZone, getTz, isProjection, monthLabel, toIso } from '@/utils/calendar';

function buildMonthWeeks(anchor: Date): Date[][] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);

  // Sunday-start grid
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const end = new Date(last);
  end.setDate(end.getDate() + (6 - last.getDay()));

  const weeks: Date[][] = [];
  const cur = new Date(start);
  let week: Date[] = [];

  while (cur <= end) {
    week.push(new Date(cur));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (week.length > 0) weeks.push(week);
  return weeks;
}

export function useCalendar(initial: CalendarAssignmentsListResponse, classroomId: number) {
  const [month, setMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const [data, setData] = React.useState<CalendarAssignmentsListResponse>(initial);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const tz = getTz(data.classroom?.timeZone);

  const weeks = React.useMemo(() => buildMonthWeeks(month), [month]);
  const inMonth = React.useCallback((d: Date) => d.getMonth() === month.getMonth(), [month]);

  const loadAllForMonth = React.useCallback(
    async (target: Date) => {
      setLoading(true);
      setError(null);
      try {
        const monthStart = startOfMonth(target);
        const monthEnd = endOfMonth(target);

        let projections: CalendarProjectionRow[] = [];
        let cursor: string | null = null;
        let allRows: CalendarAssignmentDTO[] = [];
        let nextCursor: string | null = null;

        for (let i = 0; i < 4; i++) {
          const url = new URL(
            `/api/teacher/classrooms/${classroomId}/assignments`,
            window.location.origin,
          );
          url.searchParams.set('status', 'all');
          url.searchParams.set('limit', '50');
          if (cursor) url.searchParams.set('cursor', cursor);

          const res = await fetch(url.toString(), { cache: 'no-store' });
          const json = (await res
            .json()
            .catch(() => null)) as CalendarAssignmentsListResponse | null;

          if (!res.ok) {
            const maybe = json as unknown as { error?: unknown } | null;
            const msg = typeof maybe?.error === 'string' ? maybe.error : 'Failed to load';
            throw new Error(msg);
          }

          if (i === 0 && Array.isArray(json?.projections)) {
            projections = json!.projections!;
          }

          const rows = Array.isArray(json?.rows) ? json!.rows : [];
          allRows = [...allRows, ...rows];
          nextCursor = json?.nextCursor ?? null;

          if (!nextCursor) break;
          cursor = nextCursor;
          if (allRows.length >= 200) break;
        }

        const filteredRows = allRows.filter((a) => {
          const opens = new Date(a.opensAt);
          return (
            opens >=
              new Date(
                monthStart.getFullYear(),
                monthStart.getMonth(),
                monthStart.getDate(),
                0,
                0,
                0,
              ) &&
            opens <=
              new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59)
          );
        });

        const filteredProjections = projections.filter((p) => {
          const opens = new Date(p.opensAt);
          return (
            opens >=
              new Date(
                monthStart.getFullYear(),
                monthStart.getMonth(),
                monthStart.getDate(),
                0,
                0,
                0,
              ) &&
            opens <=
              new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59)
          );
        });

        setData((prev) => ({
          classroom: prev.classroom,
          rows: filteredRows,
          projections: filteredProjections,
          nextCursor,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [classroomId],
  );

  React.useEffect(() => {
    void loadAllForMonth(month);
  }, [month, loadAllForMonth]);

  const mergedItems = React.useMemo<CalendarItemRow[]>(() => {
    const real = Array.isArray(data?.rows) ? data.rows : [];
    const projections = Array.isArray(data?.projections) ? data.projections : [];

    const realKeys = new Set<string>();
    for (const a of real) {
      if (a.scheduleId && a.runDate) realKeys.add(`${a.scheduleId}|${a.runDate}`);
    }

    const filteredProjections = projections.filter(
      (p) => !realKeys.has(`${p.scheduleId}|${p.runDate}`),
    );

    return [...real, ...filteredProjections];
  }, [data?.rows, data?.projections]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarItemRow[]>();

    for (const it of mergedItems) {
      const key = dayKeyInTimeZone(toIso(it.opensAt), tz);
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }

    for (const [k, list] of map.entries()) {
      list.sort(
        (x, y) => new Date(toIso(x.opensAt)).getTime() - new Date(toIso(y.opensAt)).getTime(),
      );
      map.set(k, list);
    }

    return map;
  }, [mergedItems, tz]);

  const openDetailsPayloadFor = (item: CalendarItemRow) => {
    const date = formatInTimeZone(toIso(item.opensAt), tz, 'yyyy-MM-dd');
    const time = formatInTimeZone(toIso(item.opensAt), tz, 'HH:mm');
    return { date, time, item };
  };

  return {
    month,
    setMonth,
    addMonths,
    weeks,
    inMonth,
    tz,
    monthLabel,
    data,
    loading,
    error,
    byDay,
    mergedItems,
    loadAllForMonth,
    isProjection,
    toIso,
    openDetailsPayloadFor,
  } as const;
}
