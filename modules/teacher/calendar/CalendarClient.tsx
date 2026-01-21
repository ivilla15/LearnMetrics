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
  classroom?: { id: number; name: string; timeZone?: string };
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

function isPast(isoUtc: string): boolean {
  return new Date(isoUtc).getTime() <= Date.now();
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

  const tz = getTz(data.classroom?.timeZone);

  const selectedClosed = selected ? isPast(selected.closesAt) : false;
  const [editOpen, setEditOpen] = React.useState(false);
  const [editLocalDate, setEditLocalDate] = React.useState(''); // yyyy-MM-dd
  const [editLocalTime, setEditLocalTime] = React.useState(''); // HH:mm
  const [editWindowMinutes, setEditWindowMinutes] = React.useState<string>('');
  const [editNumQuestions, setEditNumQuestions] = React.useState<string>('');
  const [editSaving, setEditSaving] = React.useState(false);

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

    const tz = getTz(data.classroom?.timeZone);

    for (const a of rows) {
      const key = dayKeyInTimeZone(a.opensAt, tz);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }

    for (const [k, list] of map.entries()) {
      list.sort((x, y) => new Date(x.opensAt).getTime() - new Date(y.opensAt).getTime());
      map.set(k, list);
    }

    return map;
  }, [data?.rows, data?.classroom?.timeZone]);

  function openDetails(a: AssignmentRow) {
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
    if (!selected) return;

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

      // Always pick a valid window so closesAt is always consistent with opensAt
      const windowToUse = parsedWindow ?? selected.windowMinutes ?? 4;

      const closesAtUtc = new Date(opensAtUtc.getTime() + windowToUse * 60 * 1000);

      const body: Record<string, unknown> = {
        opensAt: opensAtUtc.toISOString(),
        closesAt: closesAtUtc.toISOString(),
        windowMinutes: windowToUse,
      };

      if (nq !== undefined) body.numQuestions = nq;

      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${selected.assignmentId}`,
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
  async function onDelete(a: AssignmentRow) {
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
              const key = formatInTimeZone(d, tz, 'yyyy-MM-dd');
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
                            {formatInTimeZone(
                              a.opensAt,
                              data.classroom?.timeZone ?? 'UTC',
                              'h:mm a',
                            )}
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

              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedClosed) return;
                  setEditOpen(true);
                }}
                disabled={selectedClosed}
              >
                Edit date/time
              </Button>

              <Button
                variant="destructive"
                onClick={() => void onDelete(selected)}
                disabled={selectedClosed}
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
                  selected.opensAt,
                  data.classroom?.timeZone ?? 'UTC',
                  'MMM d, h:mm a',
                )}
              </span>
              {' · '}
              Closes:{' '}
              <span className="text-[hsl(var(--fg))] font-medium">
                {formatInTimeZone(
                  selected.closesAt,
                  data.classroom?.timeZone ?? 'UTC',
                  'MMM d, h:mm a',
                )}
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
              className="h-10 rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Time</label>
            <input
              type="time"
              value={editLocalTime}
              onChange={(e) => setEditLocalTime(e.target.value)}
              className="h-10 rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Window minutes</label>
            <input
              inputMode="numeric"
              value={editWindowMinutes}
              onChange={(e) => setEditWindowMinutes(e.target.value)}
              placeholder="4"
              className="h-10 rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Number of questions</label>
            <input
              inputMode="numeric"
              value={editNumQuestions}
              onChange={(e) => setEditNumQuestions(e.target.value)}
              placeholder="12"
              className="h-10 rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
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
