'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Section,
  Skeleton,
} from '@/components';

import { AppShell, studentNavItems } from '@/modules';
import { formatLocal } from '@/lib';
import { AttemptRow, MeDTO } from '@/types';

type NextAssignmentDTO = {
  id: number;
  kind: string;
  mode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
} | null;

type AssignmentStatus = 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED' | null;

/* ---------- type guards ---------- */

function isMeDTO(value: unknown): value is MeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.username === 'string' &&
    typeof v.level === 'number'
  );
}

function isNextAssignment(value: unknown): value is Exclude<NextAssignmentDTO, null> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.id === 'number' &&
      typeof v.kind === 'string' &&
      (v.mode === 'SCHEDULED' || v.mode === 'MANUAL') &&
      typeof v.opensAt === 'string' &&
      typeof v.closesAt === 'string' &&
      v.windowMinutes === null) ||
    typeof v.windowMinutes === 'number'
  );
}

function isAttemptRow(value: unknown): value is AttemptRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.attemptId === 'number' &&
    typeof v.assignmentId === 'number' &&
    typeof v.completedAt === 'string' &&
    typeof v.assignmentKind === 'string' &&
    typeof v.assignmentMode === 'string' &&
    typeof v.levelAtTime === 'number' &&
    typeof v.score === 'number' &&
    typeof v.total === 'number' &&
    typeof v.percent === 'number' &&
    typeof v.wasMastery === 'boolean'
  );
}

/* ---------- helpers ---------- */

function statusFor(a: NextAssignmentDTO) {
  if (!a) return { label: 'No upcoming tests', canStart: false };

  const now = Date.now();
  const opens = new Date(a.opensAt).getTime();
  const closes = new Date(a.closesAt).getTime();

  if (now < opens) return { label: 'Not open yet', canStart: false };
  if (now > closes) return { label: 'Closed', canStart: false };
  return { label: 'Open now', canStart: true };
}

function DashboardSkeleton() {
  return (
    <>
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-44" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-28 rounded-(--radius)" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-52" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-9 w-40 rounded-(--radius)" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-11 w-32 rounded-(--radius)" />
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-4 w-full max-w-45" />
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>
    </>
  );
}

/* ---------- page ---------- */

export default function StudentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [nextStatus, setNextStatus] = useState<AssignmentStatus>(null);
  const [latestAttempt, setLatestAttempt] = useState<AttemptRow | null>(null);
  const [me, setMe] = useState<MeDTO | null>(null);
  const [nextAssignment, setNextAssignment] = useState<NextAssignmentDTO>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- initial load ---------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [meRes, nextRes, attemptsRes] = await Promise.all([
        fetch('/api/student/me'),
        fetch('/api/student/next-assignment'),
        fetch('/api/student/attempts?filter=ALL'),
      ]);

      if (!meRes.ok) {
        if (!cancelled) setLoading(false);
        return;
      }

      const meJson: unknown = await meRes.json().catch(() => null);
      const nextJson: unknown = await nextRes.json().catch(() => null);
      const attemptsJson: unknown = await attemptsRes.json().catch(() => null);

      if (cancelled) return;

      // me
      if (meJson && typeof meJson === 'object') {
        const maybeStudent = (meJson as { student?: unknown }).student ?? meJson;
        setMe(isMeDTO(maybeStudent) ? maybeStudent : null);
      } else {
        setMe(null);
      }

      // next assignment
      const candidate =
        nextJson && typeof nextJson === 'object'
          ? ((nextJson as { assignment?: unknown }).assignment ?? nextJson)
          : null;

      setNextAssignment(isNextAssignment(candidate) ? candidate : null);

      // attempts
      const rows =
        attemptsJson && typeof attemptsJson === 'object'
          ? (attemptsJson as { rows?: unknown[] }).rows
          : null;

      const parsedAttempts = Array.isArray(rows) ? rows.filter(isAttemptRow) : [];
      setLatestAttempt(parsedAttempts.length ? parsedAttempts[0] : null);

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- status load (if there is a next assignment) ---------- */
  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      if (!nextAssignment) {
        setNextStatus(null);
        return;
      }

      const res = await fetch(`/api/student/assignments/${nextAssignment.id}`);
      const json: unknown = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok || !json || typeof json !== 'object') {
        setNextStatus(null);
        return;
      }

      setNextStatus((json as { status?: AssignmentStatus }).status ?? null);
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [nextAssignment]);

  const s = statusFor(nextAssignment);

  const id = nextAssignment?.id;
  const hasNext = typeof id === 'number';
  const alreadySubmitted = nextStatus === 'ALREADY_SUBMITTED';
  const buttonLabel = alreadySubmitted ? 'See results' : 'Start test';
  const canClick = hasNext && (alreadySubmitted || s.canStart);

  return (
    <AppShell navItems={studentNavItems} currentPath={pathname}>
      <PageHeader
        title={loading ? 'Dashboard' : `Welcome, ${me?.name ?? ''}`}
        subtitle={loading ? 'Loading your dashboard…' : me ? `Level ${me.level}` : undefined}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : !me ? (
        <Section>
          <Card>
            <CardContent className="py-8 text-[15px] text-[hsl(var(--muted-fg))]">
              Not signed in.
            </CardContent>
          </Card>
        </Section>
      ) : (
        <>
          <Section>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Latest result</CardTitle>
                  <CardDescription>Your most recent test score</CardDescription>
                </CardHeader>

                <CardContent>
                  {latestAttempt ? (
                    <>
                      <div className="flex items-start justify-between gap-6">
                        {/* Left: score + meta */}
                        <div className="space-y-2">
                          <div
                            className={[
                              'text-4xl font-semibold tracking-tight',
                              latestAttempt.percent === 100
                                ? 'text-[hsl(var(--success))]'
                                : 'text-[hsl(var(--danger))]',
                            ].join(' ')}
                          >
                            {latestAttempt.percent}%
                          </div>

                          {/* Level worked on + mastery pill */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[15px] font-semibold text-[hsl(var(--fg))]">
                              Level worked on:{' '}
                              <span className="font-semibold">{latestAttempt.levelAtTime}</span>
                            </div>

                            <span
                              className={[
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                                latestAttempt.wasMastery
                                  ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.25)]'
                                  : 'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] border border-[hsl(var(--danger)/0.22)]',
                              ].join(' ')}
                            >
                              {latestAttempt.wasMastery ? 'Mastered' : 'Not mastered'}
                            </span>
                          </div>

                          <div className="text-sm text-[hsl(var(--muted-fg))]">
                            {latestAttempt.score}/{latestAttempt.total} ·{' '}
                            {formatLocal(latestAttempt.completedAt)}
                          </div>
                        </div>

                        {/* Right: “cup” level meter */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-[15px] font-semibold text-[hsl(var(--fg))]">
                            Level meter
                          </div>

                          <div className="relative h-15 w-10 overflow-hidden rounded-2xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))]">
                            <div
                              className="absolute inset-x-0 bottom-0 bg-[hsl(var(--brand))]"
                              style={{
                                height: `${Math.max(10, (latestAttempt.levelAtTime / 12) * 100)}%`,
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                          </div>

                          <div className="font-semibold">{latestAttempt.levelAtTime}/12</div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          onClick={() => router.push('/student/progress')}
                        >
                          View details
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-[hsl(var(--muted-fg))]">No results yet.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Practice</CardTitle>
                  <CardDescription>Warm up before your next test</CardDescription>
                </CardHeader>

                <CardContent className="flex h-full flex-col">
                  <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--surface-2))]">
                        <span className="text-xl text-[hsl(var(--muted-fg))]">⏱</span>
                      </div>

                      <div className="text-[15px] font-semibold text-[hsl(var(--fg))]">
                        Practice anytime
                      </div>

                      <div className="text-sm text-[hsl(var(--muted-fg))]">
                        Build speed and accuracy. Practice does not affect your level.
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="mt-6"
                      onClick={() => router.push('/student/practice')}
                    >
                      Start practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {nextAssignment ? (
            <Section>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <CardTitle>Next test</CardTitle>
                      <CardDescription>
                        {nextAssignment.mode === 'MANUAL' ? 'Manual test' : 'Weekly scheduled test'}
                      </CardDescription>
                    </div>

                    <Button
                      size="lg"
                      disabled={!canClick}
                      onClick={() => {
                        if (!canClick || !id) return;
                        router.push(`/student/assignments/${id}`);
                      }}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-5 md:grid-cols-3">
                  {[
                    { label: 'Opens', value: formatLocal(nextAssignment.opensAt) },
                    { label: 'Closes', value: formatLocal(nextAssignment.closesAt) },
                    {
                      label: 'Duration',
                      value:
                        typeof nextAssignment.windowMinutes === 'number'
                          ? `${nextAssignment.windowMinutes} minutes`
                          : 'No time limit',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-5"
                    >
                      <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                        {item.label}
                      </div>
                      <div className="mt-2 text-[15px] font-medium">{item.value}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Section>
          ) : (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>No upcoming tests</CardTitle>
                  <CardDescription>You’re all caught up. Check back later.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-[hsl(var(--muted-fg))]">
                    When your teacher schedules a test, it will appear here.
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}
        </>
      )}
    </AppShell>
  );
}
