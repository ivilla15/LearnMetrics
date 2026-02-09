import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarAssignmentDTO, CalendarItemRow, CalendarProjectionRow } from '@/types';

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function buildMonthGrid(anchor: Date) {
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

export function getTz(classroomTz: string | undefined): string {
  return classroomTz && classroomTz.trim().length > 0 ? classroomTz : 'America/Los_Angeles';
}

export function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

export function isPast(value: string | Date): boolean {
  return new Date(toIso(value)).getTime() <= Date.now();
}

export function dayKeyInTimeZone(isoUtc: string, tz: string): string {
  return formatInTimeZone(isoUtc, tz, 'yyyy-MM-dd');
}

export function isProjection(it: CalendarItemRow): it is CalendarProjectionRow {
  return it.kind === 'projection';
}

export function dedupeAndMergeItems(params: {
  rows: CalendarAssignmentDTO[];
  projections: CalendarProjectionRow[];
}): CalendarItemRow[] {
  const { rows, projections } = params;

  const realKeys = new Set<string>();
  for (const a of rows) {
    if (a.scheduleId && a.runDate) realKeys.add(`${a.scheduleId}|${a.runDate}`);
  }

  const filteredProjections = projections.filter(
    (p) => !realKeys.has(`${p.scheduleId}|${p.runDate}`),
  );

  return [...rows, ...filteredProjections];
}

export function groupItemsByDay(params: { items: CalendarItemRow[]; tz: string }) {
  const { items, tz } = params;
  const map = new Map<string, CalendarItemRow[]>();

  for (const it of items) {
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
}

export function parseNumberOrUndefined(raw: string): number | undefined {
  const v = raw.trim();
  if (v.length === 0) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
