'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Modal,
  HelpText,
  pill,
  useToast,
} from '@/components';
import { formatLocal } from '@/lib/date';

type AssignmentRow = {
  assignmentId: number;
  kind: string;
  assignmentMode: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  stats?: {
    attemptedCount: number;
    totalStudents: number;
    masteryRate: number;
    avgPercent: number;
  };
};

type AssignmentsListResponse = {
  classroom?: { id: number; name: string };
  rows: AssignmentRow[];
  nextCursor: string | null;
};

type ApiErrorShape = { error?: unknown };

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const maybe = (payload as ApiErrorShape).error;
    if (typeof maybe === 'string' && maybe.trim().length > 0) return maybe;
  }
  return fallback;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}
function dayKey(d: Date) {
  // local YYYY-MM-DD
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMonthGrid(anchor: Date) {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);

  // Sunday-start grid
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const days: Date[] = [];
  const cur = new Date(start);

  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

export function CalendarClient({
  classroomId,
  initial,
}: {
  classroomId: number;
  initial: AssignmentsListResponse;
}) {
  const toast = useToast();

  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [data, setData] = React.useState<AssignmentsListResponse>(initial);
  const [loading, setLoading] = React.useState(false);

  const [selected, setSelected] = React.useState<AssignmentRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const days = React.useMemo(() => buildMonthGrid(month), [month]);
  const inMonth = React.useCallback((d: Date) => d.getMonth() === month.getMonth(), [month]);

  // --- Fetch enough assignments so calendar doesn't miss items ---
  // Strategy: paginate "all" and client-filter to current month.
  async function loadAllForMonth(target: Date) {
    setLoading(true);
    try {
      const monthStart = startOfMonth(target);
      const monthEnd = endOfMonth(target);

      let cursor: string | null = null;
      let allRows: AssignmentRow[] = [];
      let nextCursor: string | null = null;

      // Pull multiple pages until:
      // - no more pages, OR
      // - we have fetched far enough back that opensAt is older than monthStart and we're paging desc by id.
      // Since ordering is by id desc (which correlates with time but not guaranteed), we keep it simple:
      // grab up to ~200 rows max.
      for (let i = 0; i < 4; i++) {
        const url = new URL(
          `/api/teacher/classrooms/${classroomId}/assignments`,
          window.location.origin,
        );
        url.searchParams.set('status', 'all');
        url.searchParams.set('limit', '50');
        if (cursor) url.searchParams.set('cursor', cursor);

        const res = await fetch(url.toString(), { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as AssignmentsListResponse | null;
        if (!res.ok) {
          throw new Error(getApiErrorMessage(json, 'Failed to load'));
        }

        const rows = Array.isArray(json?.rows) ? json!.rows : [];
        allRows = [...allRows, ...rows];
        nextCursor = json?.nextCursor ?? null;

        if (!nextCursor) break;
        cursor = nextCursor;

        // If we already have plenty, stop early
        if (allRows.length >= 200) break;
      }

      // Keep only items that overlap month by opensAt date
      const filtered = allRows.filter((a) => {
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

      setData((prev) => ({
        classroom: prev.classroom,
        rows: filtered,
        nextCursor: nextCursor,
      }));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load calendar', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Load when month changes
  React.useEffect(() => {
    void loadAllForMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, classroomId]);

  // Group assignments by opensAt day
  const byDay = React.useMemo(() => {
    const map = new Map<string, AssignmentRow[]>();
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    for (const a of rows) {
      const d = new Date(a.opensAt);
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }

    for (const [k, list] of map.entries()) {
      list.sort((x, y) => new Date(x.opensAt).getTime() - new Date(y.opensAt).getTime());
      map.set(k, list);
    }

    return map;
  }, [data?.rows]);

  function openDetails(a: AssignmentRow) {
    setSelected(a);
    setDetailOpen(true);
  }

  async function onDelete(a: AssignmentRow) {
    const ok = confirm(`Delete assignment ${a.assignmentId}?`);
    if (!ok) return;

    try {
      // This will work once you add DELETE /api/teacher/classrooms/:id/assignments/:assignmentId
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${a.assignmentId}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          typeof json?.error === 'string' ? json.error : 'Failed to delete assignment',
        );
      }

      toast('Deleted assignment', 'success');
      setDetailOpen(false);
      setSelected(null);
      await loadAllForMonth(month);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete assignment', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{monthLabel(month)}</CardTitle>
              <CardDescription>
                Click an assignment to view details. Calendar is based on{' '}
                <span className="font-medium">opensAt</span>.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setMonth(addMonths(month, -1))}>
                Prev
              </Button>
              <Button variant="secondary" onClick={() => setMonth(startOfMonth(new Date()))}>
                Today
              </Button>
              <Button variant="secondary" onClick={() => setMonth(addMonths(month, 1))}>
                Next
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-[hsl(var(--muted-fg))]">Loading month…</div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-[hsl(var(--muted-fg))]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const key = dayKey(d);
              const items = byDay.get(key) ?? [];
              const isToday = sameDay(d, new Date());
              const dim = !inMonth(d);

              const firstTwo = items.slice(0, 2);
              const extra = items.length - firstTwo.length;

              return (
                <div
                  key={key}
                  className={[
                    'min-h-27.5 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-2',
                    dim ? 'opacity-60' : '',
                    isToday ? 'ring-2 ring-[hsl(var(--brand)/0.35)]' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-[hsl(var(--fg))]">{d.getDate()}</div>
                    {isToday ? <div className="text-[10px]">{pill('Today', 'muted')}</div> : null}
                  </div>

                  <div className="mt-2 space-y-1">
                    {firstTwo.map((a) => (
                      <button
                        key={a.assignmentId}
                        type="button"
                        onClick={() => openDetails(a)}
                        className="w-full text-left rounded-xl bg-[hsl(var(--surface-2))] px-2 py-1 text-xs hover:bg-[hsl(var(--brand)/0.10)] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[hsl(var(--fg))] truncate">
                            #{a.assignmentId} {a.kind}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--muted-fg))]">
                            {formatLocal(a.opensAt)}
                          </span>
                        </div>
                      </button>
                    ))}

                    {extra > 0 ? (
                      <div className="text-[11px] text-[hsl(var(--muted-fg))] px-1">
                        +{extra} more
                      </div>
                    ) : null}

                    {items.length === 0 ? (
                      <div className="text-[11px] text-[hsl(var(--muted-fg))] px-1">—</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <HelpText>
            This calendar uses <span className="font-medium">opensAt</span> to place assignments on
            dates. Next: add drag-and-drop reschedule (optional).
          </HelpText>
        </CardContent>
      </Card>

      {/* Details modal */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
        title={selected ? `Assignment ${selected.assignmentId}` : 'Assignment'}
        description="Details and actions for this assignment."
        size="lg"
        footer={
          selected ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Close
              </Button>

              {/* Edit button will call PATCH later (UI can be added next) */}
              <Button
                variant="secondary"
                onClick={() => toast('Edit UI next (PATCH endpoint)', 'success')}
              >
                Edit date/time
              </Button>

              <Button variant="destructive" onClick={() => void onDelete(selected)}>
                Delete
              </Button>
            </div>
          ) : null
        }
      >
        {!selected ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No assignment selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {pill(selected.assignmentMode, 'muted')}
              {pill(selected.kind, 'muted')}
              {pill(`${selected.numQuestions} Q`, 'muted')}
              {pill(selected.windowMinutes ? `${selected.windowMinutes} min` : 'No limit', 'muted')}
            </div>

            <div className="text-sm text-[hsl(var(--muted-fg))]">
              Opens:{' '}
              <span className="text-[hsl(var(--fg))] font-medium">
                {formatLocal(selected.opensAt)}
              </span>
              {' · '}
              Closes:{' '}
              <span className="text-[hsl(var(--fg))] font-medium">
                {formatLocal(selected.closesAt)}
              </span>
            </div>

            {selected.stats ? (
              <div className="flex flex-wrap gap-2">
                {pill(
                  `Attempted: ${selected.stats.attemptedCount}/${selected.stats.totalStudents}`,
                  'muted',
                )}
                {pill(`Mastery: ${selected.stats.masteryRate}%`, 'success')}
                {pill(`Avg: ${selected.stats.avgPercent}%`, 'muted')}
              </div>
            ) : null}

            <HelpText>
              Once you add PATCH/DELETE for assignments, these actions become fully functional.
            </HelpText>
          </div>
        )}
      </Modal>
    </div>
  );
}
