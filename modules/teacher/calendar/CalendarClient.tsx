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
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export type AssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type AssignmentDTO = {
  kind: string;
  assignmentId: number;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  stats?: AssignmentStats;
};

export type ProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  assignmentMode: 'SCHEDULED';
};

export type AssignmentsListResponse = {
  classroom?: { id: number; name: string; timeZone?: string };
  rows: AssignmentDTO[];
  projections?: ProjectionRow[];
  nextCursor: string | null;
};

type CalendarItem = AssignmentDTO | ProjectionRow;

type ApiErrorShape = { error?: unknown };

function isProjection(it: CalendarItem): it is ProjectionRow {
  return it.kind === 'projection';
}

function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function isPast(value: string | Date): boolean {
  return new Date(toIso(value)).getTime() <= Date.now();
}

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

function getTz(classroomTz: string | undefined): string {
  return classroomTz && classroomTz.trim().length > 0 ? classroomTz : 'America/Los_Angeles';
}

function dayKeyInTimeZone(isoUtc: string, tz: string): string {
  // Returns YYYY-MM-DD in the provided tz
  return formatInTimeZone(isoUtc, tz, 'yyyy-MM-dd');
}

function dayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  const [selected, setSelected] = React.useState<CalendarItem | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const days = React.useMemo(() => buildMonthGrid(month), [month]);
  const inMonth = React.useCallback((d: Date) => d.getMonth() === month.getMonth(), [month]);

  const tz = getTz(data.classroom?.timeZone);

  const selectedIsProjection = !!selected && isProjection(selected);
  const selectedClosed = selected ? isPast(selected.closesAt) : false;

  const selectedAssignment: AssignmentDTO | null =
    selected && !isProjection(selected) ? selected : null;

  const [editOpen, setEditOpen] = React.useState(false);
  const [editLocalDate, setEditLocalDate] = React.useState(''); // yyyy-MM-dd
  const [editLocalTime, setEditLocalTime] = React.useState(''); // HH:mm
  const [editWindowMinutes, setEditWindowMinutes] = React.useState<string>('');
  const [editNumQuestions, setEditNumQuestions] = React.useState<string>('');
  const [editSaving, setEditSaving] = React.useState(false);

  async function loadAllForMonth(target: Date) {
    setLoading(true);
    try {
      const monthStart = startOfMonth(target);
      const monthEnd = endOfMonth(target);

      let projections: ProjectionRow[] = [];
      let cursor: string | null = null;
      let allRows: AssignmentDTO[] = [];
      let nextCursor: string | null = null;

      // Pull up to ~200 rows max (4 pages of 50) + projections from first page.
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

        if (i === 0 && Array.isArray(json?.projections)) {
          projections = json.projections;
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
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load calendar', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadAllForMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, classroomId]);

  const mergedItems = React.useMemo<CalendarItem[]>(() => {
    const real = Array.isArray(data?.rows) ? data.rows : [];
    const projections = Array.isArray(data?.projections) ? data.projections : [];
    return [...real, ...projections];
  }, [data?.rows, data?.projections]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    const tz = getTz(data.classroom?.timeZone);

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
  }, [mergedItems, data?.classroom?.timeZone]);

  function openDetails(a: AssignmentDTO) {
    setSelected(a);

    const date = formatInTimeZone(a.opensAt, tz, 'yyyy-MM-dd');
    const time = formatInTimeZone(a.opensAt, tz, 'HH:mm');

    setEditLocalDate(date);
    setEditLocalTime(time);
    setEditWindowMinutes(a.windowMinutes == null ? '' : String(a.windowMinutes));
    setEditNumQuestions(String(a.numQuestions ?? 12));

    setDetailOpen(true);
  }

  async function onEditSave() {
    if (!selectedAssignment) return;

    if (!editLocalDate || !editLocalTime) {
      toast('Please choose a date and time', 'error');
      return;
    }

    setEditSaving(true);
    try {
      // Convert local classroom date+time -> UTC
      const local = new Date(`${editLocalDate}T${editLocalTime}:00`);
      const opensAtUtc = fromZonedTime(local, tz);

      // Parse window minutes
      const parsedWindow =
        editWindowMinutes.trim().length === 0 ? undefined : Number(editWindowMinutes.trim());

      if (
        parsedWindow !== undefined &&
        (!Number.isFinite(parsedWindow) || parsedWindow < 1 || parsedWindow > 180)
      ) {
        toast('Window minutes must be a number between 1 and 180', 'error');
        return;
      }

      // Parse num questions
      const nq = editNumQuestions.trim().length === 0 ? undefined : Number(editNumQuestions.trim());
      if (nq !== undefined && (!Number.isFinite(nq) || nq < 1 || nq > 60)) {
        toast('Num questions must be a number between 1 and 60', 'error');
        return;
      }

      // Always keep closesAt consistent with opensAt
      const windowToUse = parsedWindow ?? selectedAssignment.windowMinutes ?? 4;
      const closesAtUtc = new Date(opensAtUtc.getTime() + windowToUse * 60 * 1000);

      const body: Record<string, unknown> = {
        opensAt: opensAtUtc.toISOString(),
        closesAt: closesAtUtc.toISOString(),
        windowMinutes: windowToUse,
      };

      if (nq !== undefined) body.numQuestions = nq;

      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${selectedAssignment.assignmentId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg = typeof json?.error === 'string' ? json.error : 'Failed to update assignment';
        throw new Error(msg);
      }

      toast('Updated assignment', 'success');
      setEditOpen(false);
      setDetailOpen(false);
      setSelected(null);
      await loadAllForMonth(month);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update assignment', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  async function onDelete(a: AssignmentDTO) {
    const ok = confirm(`Delete assignment ${a.assignmentId}?`);
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${a.assignmentId}`,
        { method: 'DELETE', credentials: 'include' },
      );

      if (res.status === 204) {
        toast('Deleted assignment', 'success');
        setDetailOpen(false);
        setSelected(null);
        await loadAllForMonth(month);
        return;
      }

      const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
      const msg = typeof json?.error === 'string' ? json.error : 'Failed to delete assignment';
      throw new Error(msg);
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
              const key = dayKey(d); // grid uses local browser day labels
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
                    {firstTwo.map((item) => {
                      const proj = isProjection(item);

                      return (
                        <button
                          key={
                            proj
                              ? `p:${item.scheduleId}:${item.runDate}`
                              : `a:${(item as AssignmentDTO).assignmentId}`
                          }
                          type="button"
                          onClick={() => {
                            if (proj) {
                              toast(
                                'This is a projected test. It will become editable once created.',
                                'success',
                              );
                              return;
                            }
                            openDetails(item as AssignmentDTO);
                          }}
                          className="w-full text-left rounded-xl bg-[hsl(var(--surface-2))] px-2 py-1 text-xs hover:bg-[hsl(var(--brand)/0.10)] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[hsl(var(--fg))] truncate">
                              {proj
                                ? 'Upcoming test'
                                : `#${(item as AssignmentDTO).assignmentId} ${(item as AssignmentDTO).kind}`}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-fg))]">
                              {formatInTimeZone(toIso(item.opensAt), tz, 'h:mm a')}
                            </span>
                          </div>
                        </button>
                      );
                    })}

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
        title={
          !selected
            ? 'Assignment'
            : isProjection(selected)
              ? 'Upcoming scheduled test'
              : `Assignment ${selected.assignmentId}`
        }
        description="Details and actions for this assignment."
        size="lg"
        footer={
          selected ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Close
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedClosed || selectedIsProjection) return;
                  setEditOpen(true);
                }}
                disabled={selectedClosed || selectedIsProjection}
              >
                Edit date/time
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (!selectedAssignment) return;
                  void onDelete(selectedAssignment);
                }}
                disabled={selectedClosed || selectedIsProjection}
              >
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
                {formatInTimeZone(
                  toIso(selected.opensAt),
                  data.classroom?.timeZone ?? 'UTC',
                  'MMM d, h:mm a',
                )}
              </span>
              {' · '}
              Closes:{' '}
              <span className="text-[hsl(var(--fg))] font-medium">
                {formatInTimeZone(
                  toIso(selected.closesAt),
                  data.classroom?.timeZone ?? 'UTC',
                  'MMM d, h:mm a',
                )}
              </span>
            </div>

            {selectedAssignment?.stats ? (
              <div className="flex flex-wrap gap-2">
                {pill(
                  `Attempted: ${selectedAssignment.stats.attemptedCount}/${selectedAssignment.stats.totalStudents}`,
                  'muted',
                )}
                {pill(`Mastery: ${selectedAssignment.stats.masteryRate}%`, 'success')}
                {pill(`Avg: ${selectedAssignment.stats.avgPercent}%`, 'muted')}
              </div>
            ) : null}

            <HelpText>
              Editing/deleting is blocked once an assignment has attempts, and after the close time.
              Projections are read-only until they become real assignments.
            </HelpText>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit assignment"
        description={`Times are in ${tz}.`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void onEditSave()} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Date</label>
            <input
              type="date"
              value={editLocalDate}
              onChange={(e) => setEditLocalDate(e.target.value)}
              className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Time</label>
            <input
              type="time"
              value={editLocalTime}
              onChange={(e) => setEditLocalTime(e.target.value)}
              className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Window minutes</label>
            <input
              inputMode="numeric"
              value={editWindowMinutes}
              onChange={(e) => setEditWindowMinutes(e.target.value)}
              placeholder="4"
              className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Number of questions</label>
            <input
              inputMode="numeric"
              value={editNumQuestions}
              onChange={(e) => setEditNumQuestions(e.target.value)}
              placeholder="12"
              className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <HelpText>
            Editing is blocked once an assignment has attempts, and after the close time.
          </HelpText>
        </div>
      </Modal>
    </div>
  );
}
