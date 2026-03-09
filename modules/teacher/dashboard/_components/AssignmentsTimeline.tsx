'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { formatLocal } from '@/lib';
import { formatAssignmentMode, formatAssignmentType, formatOperation } from '@/types/display';
import type { StudentAssignmentListItemDTO, CalendarProjectionRowDTO } from '@/types';
import { Card, CardHeader, Pill, Modal, Button } from '@/components';
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

function formatMonthDay(day: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(day);
}

function formatShortMonthDay(day: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(day);
}

function dayHeader(day: Date, now: Date): DayHeader {
  const a = startOfDay(day).getTime();
  const b = startOfDay(now).getTime();
  const diffDays = Math.round((a - b) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return { title: 'Today', subtitle: formatMonthDay(day) };
  if (diffDays === 1) return { title: `Tomorrow, ${formatMonthDay(day)}`, subtitle: null };
  if (diffDays === -1) return { title: `Yesterday, ${formatMonthDay(day)}`, subtitle: null };

  return { title: formatShortMonthDay(day), subtitle: null };
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

function groupByDay(rows: TimelineItem[]): DayGroup[] {
  const now = new Date();
  const map = new Map<string, DayGroup>();

  for (const d of [addDays(now, -1), now, addDays(now, 1)]) {
    const key = toDayKey(d);
    map.set(key, { key, header: dayHeader(d, now), rows: [] });
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
      const rank = (s: 'OPEN' | 'UPCOMING' | 'FINISHED') =>
        s === 'OPEN' ? 0 : s === 'UPCOMING' ? 1 : 2;

      const rr = rank(getItemStatus(r1)) - rank(getItemStatus(r2));
      if (rr !== 0) return rr;

      const t1 = new Date(r1.opensAt).getTime();
      const t2 = new Date(r2.opensAt).getTime();
      return t1 - t2;
    });
  }

  return groups;
}

export function AssignmentsTimeline({
  rows,
  loading = false,
  loadingOlder = false,
  hasMore = false,
}: Props) {
  const router = useRouter();
  const groups = React.useMemo(() => groupByDay(rows), [rows]);

  const didScrollRef = React.useRef(false);
  const todayAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const todayKey = toDayKey(new Date());

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
      url.searchParams.set('runDate', proj.runDate.slice(0, 10)); // YYYY-MM-DD

      const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as {
        rows?: unknown;
        error?: unknown;
      } | null;

      if (!res.ok) {
        const msg =
          typeof json?.error === 'string' ? json.error : 'Could not load assignment for this date';
        setProjResolveError(msg);
        return null;
      }

      const list = Array.isArray(json?.rows) ? (json!.rows as StudentAssignmentListItemDTO[]) : [];
      const id = list[0]?.assignmentId ?? null;

      if (!id) {
        setProjResolveError('This assignment is scheduled, but it has not been created yet.');
        return null;
      }

      return id;
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
        {groups.map((g) => {
          const isToday = g.key === todayKey;

          const isCoreDay =
            g.header.title === 'Yesterday' ||
            g.header.title === 'Today' ||
            g.header.title.startsWith('Tomorrow');

          const showDayPlaceholders = (loading && isCoreDay) || (loadingOlder && hasMore);

          const placeholderCount = g.rows.length === 0 ? 2 : 1;

          return (
            <div key={g.key} className="space-y-3">
              <div ref={isToday ? todayAnchorRef : null} />

              {/* Date header OUTSIDE cards */}
              <div className="px-1">
                <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--fg))]">
                  {g.header.title}
                </div>
                {g.header.subtitle ? (
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--fg))]">
                    {g.header.subtitle}
                  </div>
                ) : null}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {g.rows.length === 0 ? (
                  showDayPlaceholders ? (
                    Array.from({ length: placeholderCount }).map((_, i) => (
                      <AssignmentRowLoadingCard key={`ph-${g.key}-${i}`} />
                    ))
                  ) : (
                    <Card variant="elevated" tone="primary">
                      <CardHeader>
                        <div className="text-sm text-[hsl(var(--fg))]">Nothing Planned Yet</div>
                      </CardHeader>
                    </Card>
                  )
                ) : (
                  <>
                    {g.rows.map((row) => {
                      const proj = isProjectionRow(row);

                      const submitted = !proj && Boolean(row.latestAttempt);
                      const title = proj
                        ? row.type
                          ? formatAssignmentType(row.type)
                          : 'Scheduled assignment'
                        : formatAssignmentType(row.type);

                      const metaLeft = row.operation ? formatOperation(row.operation) : null;
                      const metaRight = formatAssignmentMode(row.mode);

                      const windowLine = formatWindowLine({
                        opensAt: row.opensAt,
                        closesAt: row.closesAt,
                      });

                      const status = getItemStatus(row);

                      const href = proj ? null : `/student/assignments/${row.assignmentId}`;

                      return (
                        <button
                          key={proj ? `${row.scheduleId}|${row.runDate}` : row.assignmentId}
                          type="button"
                          disabled={false}
                          onClick={() => {
                            if (proj) {
                              setSelectedProj(row);
                              setProjResolveError(null);
                              setProjOpen(true);
                              return;
                            }

                            if (!href) return;
                            router.push(href);
                          }}
                          className={['block w-full text-left', proj ? '' : ''].join(' ')}
                        >
                          <Card
                            variant="elevated"
                            tone={proj ? 'default' : 'primary'}
                            className={[
                              'transition',
                              proj
                                ? 'opacity-90 hover:bg-[hsl(var(--surface-2))]'
                                : 'hover:bg-[hsl(var(--surface-2))]',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-4 px-5 py-4">
                              {/* Left */}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-5">
                                  <div className="truncate text-[15px] font-semibold text-[hsl(var(--fg))]">
                                    {title}
                                  </div>

                                  {submitted ? Pill('Submitted', 'primary') : null}

                                  {!submitted ? (
                                    <span className="text-xs text-[hsl(var(--muted-fg))]">
                                      {proj ? 'SCHEDULED' : status}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-1 text-sm text-[hsl(var(--fg))]">
                                  {[metaLeft, metaRight].filter(Boolean).join(' · ')}
                                </div>

                                <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                                  {windowLine}
                                </div>
                              </div>

                              {/* Right */}
                              <div className="shrink-0 text-right">
                                {submitted && row.latestAttempt ? (
                                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                                    {row.latestAttempt.percent}%
                                  </div>
                                ) : null}

                                <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                                  {row.durationMinutes
                                    ? `${row.durationMinutes} min`
                                    : row.windowMinutes
                                      ? `${row.windowMinutes} min window`
                                      : '—'}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </button>
                      );
                    })}

                    {showDayPlaceholders
                      ? Array.from({ length: 1 }).map((_, i) => (
                          <AssignmentRowLoadingCard key={`ph-${g.key}-tail-${i}`} />
                        ))
                      : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Projection details modal (Canvas-like) */}
      <Modal
        open={projOpen && Boolean(selectedProj)}
        onClose={closeProjectionModal}
        title="Assignment details"
        description={
          selectedProj ? (
            <div className="space-y-1">
              <div className="text-base font-semibold text-[hsl(var(--fg))]">
                {selectedProj.type
                  ? formatAssignmentType(selectedProj.type)
                  : 'Scheduled assignment'}
              </div>
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                {[
                  selectedProj.operation ? formatOperation(selectedProj.operation) : null,
                  formatAssignmentMode(selectedProj.mode),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <div className="text-xs text-[hsl(var(--muted-fg))]">
                {formatWindowLine({
                  opensAt: selectedProj.opensAt,
                  closesAt: selectedProj.closesAt,
                })}
              </div>
            </div>
          ) : null
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeProjectionModal}>
              Close
            </Button>

            <Button
              onClick={async () => {
                if (!selectedProj) return;

                const status = getItemStatus(selectedProj);

                if (status !== 'OPEN') return;

                const id = await resolveProjectionToAssignmentId(selectedProj);
                if (!id) return;

                closeProjectionModal();
                router.push(`/student/assignments/${id}`);
              }}
              disabled={!selectedProj || projResolving || projStatus !== 'OPEN'}
            >
              {projResolving
                ? 'Loading…'
                : projStatus === 'OPEN'
                  ? 'Take the test'
                  : projStatus === 'UPCOMING'
                    ? 'Not open yet'
                    : 'Closed'}
            </Button>
          </div>
        }
        size="lg"
      >
        {!selectedProj ? null : (
          <div className="space-y-3">
            {projStatus === 'UPCOMING' ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                This assignment is not open yet. It will open on{' '}
                <span className="font-semibold text-[hsl(var(--fg))]">
                  {formatLocal(selectedProj.opensAt)}
                </span>
                .
              </div>
            ) : projStatus === 'FINISHED' ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                This assignment window is closed.
              </div>
            ) : (
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                This assignment window is open. Click{' '}
                <span className="font-semibold text-[hsl(var(--fg))]">Take the test</span> to begin.
              </div>
            )}

            {projResolveError ? (
              <div className="text-sm text-[hsl(var(--danger))]">{projResolveError}</div>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}
