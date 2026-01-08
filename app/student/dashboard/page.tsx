'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { StudentShell } from '@/components/shell/StudentShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Section } from '@/components/ui/section';

type MeDTO = { id: number; name: string; username: string; level: number };
type NextAssignmentDTO = null | {
  id: number;
  kind: string;
  mode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number;
};

type AssignmentStatus = null | 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED';

function formatLocal(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function statusFor(a: NextAssignmentDTO) {
  if (!a || !Number.isFinite(a.id)) return { label: 'No upcoming tests', canStart: false };
  const now = Date.now();
  const opens = new Date(a.opensAt).getTime();
  const closes = new Date(a.closesAt).getTime();
  if (now < opens) return { label: 'Not open yet', canStart: false };
  if (now > closes) return { label: 'Closed', canStart: false };
  return { label: 'Open now', canStart: true };
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-48" />
      </div>

      <Section tone="subtle">
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-52" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-60" />
                <Skeleton className="h-5 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-72" />
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />
            ))}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/student/dashboard' },
      { label: 'Progress', href: '/student/progress' },
      { label: 'Logout', href: '/student/logout' },
    ],
    [],
  );

  const [nextStatus, setNextStatus] = useState<AssignmentStatus>(null);
  const [me, setMe] = useState<MeDTO | null>(null);
  const [nextAssignment, setNextAssignment] = useState<NextAssignmentDTO>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [meRes, nextRes] = await Promise.all([
        fetch('/api/student/me'),
        fetch('/api/student/next-assignment'),
      ]);

      if (!meRes.ok) {
        if (!cancelled) setLoading(false);
        return;
      }

      const meJson = await meRes.json();
      const nextJson = await nextRes.json().catch(() => ({ assignment: null }));

      if (cancelled) return;

      setMe(meJson?.student ?? meJson);

      const raw = nextJson?.assignment ?? nextJson ?? null;
      const normalized =
        raw && typeof raw === 'object' && Number.isFinite((raw as any).id)
          ? (raw as NextAssignmentDTO)
          : null;

      setNextAssignment(normalized);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const id = nextAssignment?.id;
      if (!Number.isFinite(id)) {
        setNextStatus(null);
        return;
      }

      const res = await fetch(`/api/student/assignments/${id}`);
      const json = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok || !json) {
        setNextStatus(null);
        return;
      }

      setNextStatus(json.status ?? null);
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [nextAssignment?.id]);

  const s = statusFor(nextAssignment);

  const id = nextAssignment?.id;
  const alreadySubmitted = nextStatus === 'ALREADY_SUBMITTED';
  const buttonLabel = alreadySubmitted ? 'See results' : 'Start test';
  const canClick = Number.isFinite(id) && (alreadySubmitted || s.canStart);

  return (
    <StudentShell navItems={navItems} currentPath={pathname}>
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
          <PageHeader title={`Welcome, ${me.name}`} subtitle={`Level ${me.level}`} />

          <Section>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Your student login</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                    Username
                  </div>
                  <div className="mt-2 text-[17px] font-semibold">{me.username}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next test status</CardTitle>
                  <CardDescription>Availability right now</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-[17px] font-semibold">{s.label}</div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <CardTitle>Next test</CardTitle>
                    <CardDescription>
                      {nextAssignment
                        ? nextAssignment.mode === 'MANUAL'
                          ? 'Manual test'
                          : 'Weekly scheduled test'
                        : 'No upcoming tests'}
                    </CardDescription>
                  </div>

                  <Button
                    size="lg"
                    disabled={!canClick}
                    onClick={() => {
                      if (!canClick) return;
                      router.push(`/student/assignments/${id}`);
                    }}
                  >
                    {buttonLabel}
                  </Button>
                </div>
              </CardHeader>

              {nextAssignment ? (
                <CardContent className="grid gap-5 md:grid-cols-3">
                  {[
                    { label: 'Opens', value: formatLocal(nextAssignment.opensAt) },
                    { label: 'Closes', value: formatLocal(nextAssignment.closesAt) },
                    { label: 'Duration', value: `${nextAssignment.windowMinutes} minutes` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-5"
                    >
                      <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                        {item.label}
                      </div>
                      <div className="mt-2 text-[15px] font-medium">{item.value}</div>
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          </Section>
        </>
      )}
    </StudentShell>
  );
}
