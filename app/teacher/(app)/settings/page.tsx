'use client';

import { useEffect, useState } from 'react';
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
import type { MeDTO } from '@/types';
import { AppShell, BillingCard, teacherNavItems } from '@/modules';
import { usePathname } from 'next/navigation';

function SettingsSkeleton() {
  return (
    <Section>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-60" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 min-h-[150px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-28" />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-44" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-52" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[120px]">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

export default function TeacherSettingsPage() {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname() ?? '';
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  async function signOutAllDevices() {
    try {
      setLogoutAllLoading(true);
      const res = await fetch('/api/teacher/logout-all', { method: 'POST' });
      if (!res.ok) return;
      window.location.href = '/teacher/login';
    } finally {
      setLogoutAllLoading(false);
    }
  }

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
    <AppShell navItems={teacherNavItems} currentPath={pathname} width="full">
      <PageHeader
        title="Settings"
        subtitle={loading ? 'Loading your settings…' : 'Manage billing and security'}
      />

      {loading ? (
        <SettingsSkeleton />
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
          <div className="grid gap-6">
            <BillingCard />

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Keep your account safe</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 min-h-[120px]">
                <Button
                  variant="destructive"
                  onClick={signOutAllDevices}
                  disabled={logoutAllLoading}
                >
                  {logoutAllLoading ? 'Signing out…' : 'Sign out of all devices'}
                </Button>

                <div className="text-[14px] text-[hsl(var(--muted-fg))]">
                  If you suspect someone else has access, reset your password and sign out
                  everywhere.
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      )}
    </AppShell>
  );
}
