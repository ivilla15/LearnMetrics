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
import { cancelOccurrenceApi, unskipOccurrenceApi } from '@/app/api/_shared/schedules';
import { Tile } from '../classroom';

export type AssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type AssignmentDTO = {
  kind: string; // e.g. "SCHEDULED_TEST"
  assignmentId: number;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: string; // ISO
  closesAt: string; // ISO
  windowMinutes: number | null;
  numQuestions: number;
  stats?: AssignmentStats;
  scheduleId?: number | null;
  runDate?: string | null;
};

export type ProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string; // ISO
  opensAt: string; // ISO UTC
  closesAt: string; // ISO UTC
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
  return formatInTimeZone(isoUtc, tz, 'yyyy-MM-dd');
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
  const selectedClosed = selected ? isPast(toIso(selected.closesAt)) : false;

  const selectedAssignment: AssignmentDTO | null =
    selected && !isProjection(selected) ? selected : null;

  const [editOpen, setEditOpen] = React.useState(false);
  const [editLocalDate, setEditLocalDate] = React.useState(''); // yyyy-MM-dd
  const [editLocalTime, setEditLocalTime] = React.useState(''); // HH:mm
  const [editWindowMinutes, setEditWindowMinutes] = React.useState<string>('');
  const [editNumQuestions, setEditNumQuestions] = React.useState<string>('');
  const [editSaving, setEditSaving] = React.useState(false);

  const loadAllForMonth = React.useCallback(
    async (target: Date) => {
      setLoading(true);
      try {
        const monthStart = startOfMonth(target);
        const monthEnd = endOfMonth(target);

        let projections: ProjectionRow[] = [];
        let cursor: string | null = null;
        let allRows: AssignmentDTO[] = [];
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
          const json = (await res.json().catch(() => null)) as AssignmentsListResponse | null;

          if (!res.ok) throw new Error(getApiErrorMessage(json, 'Failed to load'));

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
    },
    [classroomId, toast],
  );

  React.useEffect(() => {
    void loadAllForMonth(month);
  }, [month, loadAllForMonth]);

  // Merge real + projections, but drop projection if real exists for same scheduleId|runDate
  const mergedItems = React.useMemo<CalendarItem[]>(() => {
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
    const map = new Map<string, CalendarItem[]>();

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

  function openDetails(item: CalendarItem) {
    setSelected(item);

    const date = formatInTimeZone(toIso(item.opensAt), tz, 'yyyy-MM-dd');
    const time = formatInTimeZone(toIso(item.opensAt), tz, 'HH:mm');

    setEditLocalDate(date);
    setEditLocalTime(time);
    setEditWindowMinutes(item.windowMinutes == null ? '' : String(item.windowMinutes));
    setEditNumQuestions(String(item.numQuestions ?? 12));

    setDetailOpen(true);
  }

  async function onEditSave() {
    if (!selected) return;

    if (!editLocalDate || !editLocalTime) {
      toast('Please choose a date and time', 'error');
      return;
    }

    setEditSaving(true);
    try {
      const local = new Date(`${editLocalDate}T${editLocalTime}:00`);
      const opensAtUtc = fromZonedTime(local, tz);

      const parsedWindow =
        editWindowMinutes.trim().length === 0 ? undefined : Number(editWindowMinutes.trim());

      if (
        parsedWindow !== undefined &&
        (!Number.isFinite(parsedWindow) || parsedWindow < 0 || parsedWindow > 180)
      ) {
        toast('Window minutes must be a number between 0 and 180', 'error');
        return;
      }

      const nq = editNumQuestions.trim().length === 0 ? undefined : Number(editNumQuestions.trim());
      if (nq !== undefined && (!Number.isFinite(nq) || nq < 1 || nq > 60)) {
        toast('Num questions must be a number between 1 and 60', 'error');
        return;
      }

      const windowToUse = parsedWindow ?? selected.windowMinutes ?? 4;
      const closesAtUtc = new Date(opensAtUtc.getTime() + windowToUse * 60 * 1000);

      const baseBody: Record<string, unknown> = {
        opensAt: opensAtUtc.toISOString(),
        closesAt: closesAtUtc.toISOString(),
        windowMinutes: windowToUse,
      };
      if (nq !== undefined) baseBody.numQuestions = nq;

      let res: Response;

      if (isProjection(selected)) {
        const payload: Record<string, unknown> = {
          ...baseBody,
          scheduleId: selected.scheduleId,
          runDate: selected.runDate,
          assignmentMode: 'SCHEDULED',
          kind: 'SCHEDULED_TEST',
        };

        res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/teacher/classrooms/${classroomId}/assignments/${selected.assignmentId}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(baseBody),
          },
        );
      }

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg = typeof json?.error === 'string' ? json.error : 'Failed to save';
        throw new Error(msg);
      }

      toast('Saved', 'success');
      setEditOpen(false);
      setDetailOpen(false);
      setSelected(null);
      await loadAllForMonth(month);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setEditSaving(false);
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
                Click an item to view details. Calendar is based on{' '}
                <span className="font-medium">opensAt</span> in the classroom timezone.
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
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-[hsl(var(--muted-fg))]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const key = formatInTimeZone(d, tz, 'yyyy-MM-dd');
              const items = byDay.get(key) ?? [];
              const isToday = sameDay(d, new Date());
              const dim = !inMonth(d);

              const firstTwo = items.slice(0, 2);
              const extra = items.length - firstTwo.length;

              return (
                <Tile
                  key={key}
                  className={[
                    'min-h-27.5 rounded-[18px] bg-[hsl(var(--surface))] p-2',
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
                            proj ? `p:${item.scheduleId}:${item.runDate}` : `a:${item.assignmentId}`
                          }
                          type="button"
                          onClick={() => openDetails(item)}
                          className="w-full text-left rounded-xl bg-[hsl(var(--surface-2))] px-2 py-1 text-xs hover:bg-[hsl(var(--brand)/0.10)] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[hsl(var(--fg))] truncate">
                              {proj
                                ? 'Upcoming test'
                                : `#${item.assignmentId} ${item.assignmentMode}`}
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
                </Tile>
              );
            })}
          </div>

          <HelpText>
            Upcoming tests are projections. You can edit them — saving will create the real
            assignment (idempotent by schedule + run date).
          </HelpText>
        </CardContent>
      </Card>

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
        description="Details and actions."
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
                  setEditOpen(true);
                }}
                disabled={selectedClosed}
              >
                Edit date/time
              </Button>

              {isProjection(selected) ? (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await cancelOccurrenceApi(classroomId, selected.scheduleId, selected.runDate);
                      toast('Cancelled occurrence', 'success');
                      setDetailOpen(false);
                      setSelected(null);
                      await loadAllForMonth(month);
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
                    }
                  }}
                >
                  Cancel occurrence
                </Button>
              ) : selectedAssignment &&
                selectedAssignment.scheduleId &&
                selectedAssignment.runDate ? (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await cancelOccurrenceApi(
                        classroomId,
                        selectedAssignment.scheduleId!,
                        selectedAssignment.runDate!,
                      );
                      toast('Cancelled occurrence', 'success');
                      setDetailOpen(false);
                      setSelected(null);
                      await loadAllForMonth(month);
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
                    }
                  }}
                >
                  Cancel occurrence
                </Button>
              ) : null}

              {false ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await unskipOccurrenceApi(classroomId, /*scheduleId*/ 0, /*runDate*/ '');
                      toast('Un-cancelled occurrence', 'success');
                      await loadAllForMonth(month);
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Failed to un-cancel', 'error');
                    }
                  }}
                >
                  Undo cancel
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {!selected ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No selection.</div>
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
                {formatInTimeZone(toIso(selected.opensAt), tz, 'MMM d, h:mm a')}
              </span>
              {' · '}
              Closes:{' '}
              <span className="text-[hsl(var(--fg))] font-medium">
                {formatInTimeZone(toIso(selected.closesAt), tz, 'MMM d, h:mm a')}
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

            {selectedIsProjection ? (
              <HelpText>
                This is an upcoming projected test. Editing + saving will create the real
                assignment.
              </HelpText>
            ) : (
              <HelpText>
                Editing/deleting is blocked once an assignment has attempts, and after the close
                time.
              </HelpText>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={selectedIsProjection ? 'Edit upcoming test' : 'Edit assignment'}
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
              className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Time</label>
            <input
              type="time"
              value={editLocalTime}
              onChange={(e) => setEditLocalTime(e.target.value)}
              className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Window minutes</label>
            <input
              inputMode="numeric"
              value={editWindowMinutes}
              onChange={(e) => setEditWindowMinutes(e.target.value)}
              placeholder="4"
              className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Number of questions</label>
            <input
              inputMode="numeric"
              value={editNumQuestions}
              onChange={(e) => setEditNumQuestions(e.target.value)}
              placeholder="12"
              className="h-10 rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <HelpText>
            {selectedIsProjection
              ? 'Saving will create the real assignment for this schedule run.'
              : 'Editing is blocked once an assignment has attempts, and after the close time.'}
          </HelpText>
        </div>
      </Modal>
    </div>
  );
}
