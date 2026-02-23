'use client';

import { usePathname, useRouter } from 'next/navigation';

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

import { AppShell, studentNavItems, useStudentDashboard } from '@/modules';
import { formatLocal } from '@/lib';

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

export default function StudentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const { loading, me, nextAssignment, nextStatus, latestAttempt } = useStudentDashboard();

  const now = Date.now();
  const opensAtMs = nextAssignment ? new Date(nextAssignment.opensAt).getTime() : NaN;
  const closesAtMs = nextAssignment?.closesAt ? new Date(nextAssignment.closesAt).getTime() : null;

  const isUpcoming = Number.isFinite(opensAtMs) && opensAtMs > now;
  const isFinished =
    closesAtMs !== null &&
    typeof closesAtMs === 'number' &&
    Number.isFinite(closesAtMs) &&
    closesAtMs <= now;

  const canStartNow = !!nextAssignment && !isUpcoming && !isFinished;

  const id = nextAssignment?.id;
  const hasNext = typeof id === 'number';
  const alreadySubmitted = nextStatus === 'ALREADY_SUBMITTED';
  const buttonLabel = alreadySubmitted ? 'See results' : 'Start test';
  const canClick = hasNext && (alreadySubmitted || canStartNow);

  return (
    <AppShell navItems={studentNavItems} currentPath={pathname}>
      <PageHeader
        title={loading ? 'Dashboard' : `Welcome, ${me?.name ?? ''}`}
        subtitle={
          loading
            ? 'Loading your dashboard…'
            : latestAttempt
              ? `Level ${latestAttempt.levelAtTime}`
              : undefined
        }
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
