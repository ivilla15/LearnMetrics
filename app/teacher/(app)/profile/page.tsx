'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
import type { TeacherMeDTO } from '@/types';
import { AppShell, teacherNavItems } from '@/modules';

function ProfileSkeleton() {
  return (
    <Section>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your teacher details</CardDescription>
        </CardHeader>

        <CardContent className="min-h-25">
          <div className="grid gap-6 md:grid-cols-3 md:items-end">
            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Name
              </div>
              <div className="mt-3">
                <Skeleton className="h-2 w-48" />
              </div>
            </div>

            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Email
              </div>
              <div className="mt-3">
                <Skeleton className="h-2 w-56" />
              </div>
            </div>

            <div className="flex md:justify-end">
              <Button variant="destructive" disabled className="opacity-50">
                Reset Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function TeacherProfilePage() {
  const [me, setMe] = useState<TeacherMeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname() ?? '';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch('/api/teacher/me');
      const json = await res.json().catch(() => null);
      if (cancelled) return;

      if (res.ok) {
        setMe(json?.teacher ?? json ?? null);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell navItems={teacherNavItems} currentPath={pathname} width="full">
      <PageHeader title="Profile" subtitle={'View your account info'} />

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

            <CardContent className="min-h-25">
              <div className="grid gap-6 md:grid-cols-3 md:items-end">
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

                <div className="flex md:justify-end">
                  <Button variant="destructive">Reset Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}
    </AppShell>
  );
}
