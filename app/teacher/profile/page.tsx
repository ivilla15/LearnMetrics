'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { AppShell, teacherNavItems } from '@/modules';
import {
  PageHeader,
  Section,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Button,
} from '@/components';

type MeDTO = { id: number; name: string; email: string };

function ProfileSkeleton() {
  return (
    <>
      <Section>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-52" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-56" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}

export default function TeacherProfilePage() {
  const pathname = usePathname();

  const [me, setMe] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const res = await fetch('/api/teacher/me');
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }

      const json = await res.json().catch(() => null);
      if (cancelled) return;

      setMe(json?.teacher ?? json ?? null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell navItems={teacherNavItems} currentPath={pathname}>
      <PageHeader
        title={loading ? 'Profile' : me ? me.name : 'Profile'}
        subtitle={loading ? 'Loading your account…' : me ? 'View your account info' : undefined}
      />

      {loading ? (
        <ProfileSkeleton />
      ) : !me ? (
        <Section>
          <Card>
            <CardContent className="py-8 text-[15px] text-[hsl(var(--muted-fg))]">
              Not signed in.
            </CardContent>
          </Card>
        </Section>
      ) : (
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your teacher details</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Name
                </div>
                <div className="mt-2 text-[17px] font-semibold">{me.name}</div>
              </div>

              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Email
                </div>
                <div className="mt-2 text-[17px] font-semibold">{me.email}</div>
              </div>

              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Teacher ID
                </div>
                <div className="mt-2 text-[17px] font-semibold">{me.id}</div>
              </div>

              <div>
                <Button variant={'destructive'}>Reset Password</Button>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}
    </AppShell>
  );
}
