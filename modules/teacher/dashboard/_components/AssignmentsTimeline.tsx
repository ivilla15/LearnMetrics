'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { formatLocal } from '@/lib';
import { formatAssignmentMode, formatAssignmentType, formatOperation } from '@/types/display';
import type { StudentAssignmentListItemDTO, CalendarProjectionRowDTO } from '@/types';
import { Card, CardHeader, Pill, Modal, Button } from '@/components';
import { formatWeekdayMonthDay } from '@/utils';
import { AssignmentRowLoadingCard } from '@/modules';

type TimelineItem = StudentAssignmentListItemDTO | CalendarProjectionRowDTO;

type Props = {
  rows: TimelineItem[];
  loading?: boolean;
  loadingOlder?: boolean;
  hasMore?: boolean;
};

type DayHeader = {
  title: string;
  subtitle: string | null;
};

type DayGroup = {
  key: string;
  header: DayHeader;
  rows: TimelineItem[];
};

// --- Utilities ---

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function addDays(base: Date, deltaDays: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayHeader(day: Date, now: Date): DayHeader {
  const a = startOfDay(day).getTime();
  const b = startOfDay(now).getTime();
  const diffDays = Math.round((a - b) / (24 * 60 * 60 * 1000));
  const fullDate = formatWeekdayMonthDay(day);

  if (diffDays === 0) return { title: 'Today', subtitle: fullDate };
  if (diffDays === 1) return { title: 'Tomorrow', subtitle: fullDate };
  if (diffDays === -1) return { title: 'Yesterday', subtitle: fullDate };
  return { title: fullDate, subtitle: null };
}

function isProjectionRow(row: TimelineItem): row is CalendarProjectionRowDTO {
  return (row as CalendarProjectionRowDTO).kind === 'projection';
}

function getRowDate(row: TimelineItem) {
  if (isProjectionRow(row)) {
    const [y, m, d] = row.runDate.slice(0, 10).split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return new Date(row.opensAt);
  }
  if (row.runDate) {
    const [y, m, d] = row.runDate.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date(row.opensAt);
}

function getItemStatus(row: TimelineItem): 'OPEN' | 'UPCOMING' | 'FINISHED' {
  if (!isProjectionRow(row)) return row.status;
  const now = Date.now();
  const opensMs = new Date(row.opensAt).getTime();
  const closesMs = new Date(row.closesAt).getTime();
  if (opensMs > now) return 'UPCOMING';
  if (closesMs <= now) return 'FINISHED';
  return 'OPEN';
}

function formatWindowLine(params: { opensAt: string; closesAt: string | null }) {
  const now = Date.now();
  const closesMs = params.closesAt ? new Date(params.closesAt).getTime() : null;
  if (closesMs !== null && Number.isFinite(closesMs) && closesMs < now) {
    return `Closed at: ${formatLocal(params.closesAt!)}`;
  }
  if (params.closesAt) {
    return `Opens: ${formatLocal(params.opensAt)} · Closes: ${formatLocal(params.closesAt)}`;
  }
  return `Opens: ${formatLocal(params.opensAt)}`;
}

function groupByDay(rows: TimelineItem[], loading: boolean): DayGroup[] {
  const now = new Date();
  const map = new Map<string, DayGroup>();

  if (loading && rows.length === 0) {
    for (const d of [addDays(now, -1), now, addDays(now, 1)]) {
      const key = toDayKey(d);
      map.set(key, { key, header: dayHeader(d, now), rows: [] });
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
  }

  for (const row of rows) {
    const d = getRowDate(row);
    const key = toDayKey(d);
    const existing = map.get(key);
    if (existing) existing.rows.push(row);
    else map.set(key, { key, header: dayHeader(d, now), rows: [row] });
  }

  const groups = Array.from(map.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
  for (const g of groups) {
    g.rows.sort((r1, r2) => {
      const rank = (s: string) => (s === 'OPEN' ? 0 : s === 'UPCOMING' ? 1 : 2);
      const rr = rank(getItemStatus(r1)) - rank(getItemStatus(r2));
      if (rr !== 0) return rr;
      return new Date(r1.opensAt).getTime() - new Date(r2.opensAt).getTime();
    });
  }
  return groups;
}

// --- Main Component ---

export function AssignmentsTimeline({
  rows,
  loading = false,
  loadingOlder = false,
  hasMore = false,
}: Props) {
  const router = useRouter();
  const groups = React.useMemo(() => groupByDay(rows, loading), [rows, loading]);

  const todayKey = toDayKey(new Date());
  const didScrollRef = React.useRef(false);
  const todayAnchorRef = React.useRef<HTMLDivElement | null>(null);

  const [projOpen, setProjOpen] = React.useState(false);
  const [selectedProj, setSelectedProj] = React.useState<CalendarProjectionRowDTO | null>(null);
  const [projResolving, setProjResolving] = React.useState(false);
  const [projResolveError, setProjResolveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (didScrollRef.current) return;
    if (!todayAnchorRef.current) return;
    didScrollRef.current = true;
    todayAnchorRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [groups]);

  const closeProjectionModal = React.useCallback(() => {
    setProjOpen(false);
    setSelectedProj(null);
    setProjResolving(false);
    setProjResolveError(null);
  }, []);

  async function resolveProjectionToAssignmentId(proj: CalendarProjectionRowDTO) {
    setProjResolving(true);
    setProjResolveError(null);
    try {
      const url = new URL('/api/student/assignments', window.location.origin);
      url.searchParams.set('scope', 'all');
      url.searchParams.set('limit', '1');
      url.searchParams.set('scheduleId', String(proj.scheduleId));
      url.searchParams.set('runDate', proj.runDate.slice(0, 10));

      const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
      const json = await res.json();

      if (!res.ok) {
        setProjResolveError(json?.error || 'Could not load assignment');
        return null;
      }
      return json?.rows?.[0]?.assignmentId ?? null;
    } catch {
      setProjResolveError('Could not load assignment for this date');
      return null;
    } finally {
      setProjResolving(false);
    }
  }

  const projStatus = selectedProj ? getItemStatus(selectedProj) : null;

  return (
    <>
      <div className="space-y-6">
        {groups.map((g, index) => {
          const isToday = g.key === todayKey;
          const isLastGroup = index === groups.length - 1;

          // Check hasMore to ensure we only show skeletons if more data is expected
          const showSkeletons =
            (loading && rows.length === 0) || (loadingOlder && isLastGroup && hasMore);

          return (
            <div key={g.key} className="space-y-3">
              <div ref={isToday ? todayAnchorRef : null} className="px-1">
                <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--fg))]">
                  {g.header.title}
                </div>
                {g.header.subtitle && (
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--fg))]">
                    {g.header.subtitle}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {showSkeletons ? (
                  <>
                    <AssignmentRowLoadingCard />
                  </>
                ) : g.rows.length === 0 ? (
                  <Card variant="elevated" tone="primary">
                    <CardHeader>
                      <div className="text-sm text-[hsl(var(--fg))]">Nothing Planned Yet</div>
                    </CardHeader>
                  </Card>
                ) : (
                  g.rows.map((row) => {
                    const proj = isProjectionRow(row);
                    const submitted = !proj && Boolean(row.latestAttempt);
                    const title = proj
                      ? row.type
                        ? formatAssignmentType(row.type)
                        : 'Scheduled assignment'
                      : formatAssignmentType(row.type);

                    const metaLeft = row.operation ? formatOperation(row.operation) : null;
                    const metaRight = formatAssignmentMode(row.mode);
                    const status = getItemStatus(row);
                    const href = proj ? null : `/student/assignments/${row.assignmentId}`;

                    return (
                      <button
                        key={proj ? `${row.scheduleId}|${row.runDate}` : row.assignmentId}
                        type="button"
                        onClick={() => {
                          if (proj) {
                            setSelectedProj(row);
                            setProjOpen(true);
                          } else if (href) {
                            router.push(href);
                          }
                        }}
                        className="block w-full text-left"
                      >
                        <Card
                          variant="elevated"
                          tone={proj ? 'default' : 'primary'}
                          className="transition hover:bg-[hsl(var(--surface-2))]"
                        >
                          <div className="flex items-start justify-between gap-4 px-5 py-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-5">
                                <div className="truncate text-[15px] font-semibold text-[hsl(var(--fg))]">
                                  {title}
                                </div>
                                {submitted ? Pill('Submitted', 'primary') : null}
                                {!submitted && (
                                  <span className="text-xs text-[hsl(var(--muted-fg))] uppercase">
                                    {proj ? 'Scheduled' : status}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-[hsl(var(--fg))]">
                                {[metaLeft, metaRight].filter(Boolean).join(' · ')}
                              </div>
                              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                                {formatWindowLine({ opensAt: row.opensAt, closesAt: row.closesAt })}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {submitted && row.latestAttempt && (
                                <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                                  {row.latestAttempt.percent}%
                                </div>
                              )}
                              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                                {row.durationMinutes ? `${row.durationMinutes} min` : '—'}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={projOpen && !!selectedProj}
        onClose={closeProjectionModal}
        title="Assignment details"
        description={
          selectedProj && (
            <div className="space-y-1">
              <div className="text-base font-semibold text-[hsl(var(--fg))]">
                {selectedProj.type
                  ? formatAssignmentType(selectedProj.type)
                  : 'Scheduled assignment'}
              </div>
              <div className="text-xs text-[hsl(var(--muted-fg))]">
                {formatWindowLine({
                  opensAt: selectedProj.opensAt,
                  closesAt: selectedProj.closesAt,
                })}
              </div>
            </div>
          )
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeProjectionModal}>
              Close
            </Button>
            <Button
              onClick={async () => {
                if (!selectedProj || projStatus !== 'OPEN') return;
                const id = await resolveProjectionToAssignmentId(selectedProj);
                if (id) {
                  closeProjectionModal();
                  router.push(`/student/assignments/${id}`);
                }
              }}
              disabled={!selectedProj || projResolving || projStatus !== 'OPEN'}
            >
              {projResolving ? 'Loading…' : projStatus === 'OPEN' ? 'Take the test' : 'Closed'}
            </Button>
          </div>
        }
        size="lg"
      >
        {selectedProj && (
          <div className="space-y-3">
            <div className="text-sm text-[hsl(var(--muted-fg))]">
              {projStatus === 'UPCOMING'
                ? `Opens at ${formatLocal(selectedProj.opensAt)}`
                : 'Assignment window status checked.'}
            </div>
            {projResolveError && (
              <div className="text-sm text-[hsl(var(--danger))]">{projResolveError}</div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
