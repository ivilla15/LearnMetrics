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
  Button,
} from '@/components';
import type { TeacherMeDTO } from '@/types';
import { AppShell, BillingCard, SettingsSkeleton, teacherNavItems } from '@/modules';
import { usePathname } from 'next/navigation';

export default function TeacherSettingsPage() {
  const [me, setMe] = useState<TeacherMeDTO | null>(null);
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
      <PageHeader title="Settings" subtitle="Manage billing and security" />

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

              <CardContent className="space-y-4">
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
