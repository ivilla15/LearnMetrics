'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  PageHeader,
  Section,
  Skeleton,
} from '@/components';
import { studentNavItems, AppShell, unwrapField, looksLikeStudentMe } from '@/modules';
import type { StudentMeDTO } from '@/types';

/**
 * Enhanced Skeleton that shows static UI labels immediately.
 */
function ProfileSkeleton() {
  return (
    <Section>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your student details</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 sm:grid-cols-2">
          {/* Name Section */}
          <div>
            <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
              Name
            </div>
            <div className="mt-2">
              <Skeleton className="h-5 w-1/4 animate-pulse rounded-md bg-[hsl(var(--surface-2))]" />
            </div>
          </div>

          {/* Username Section */}
          <div>
            <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
              Username
            </div>
            <div className="mt-2">
              <Skeleton className="h-5 w-1/4 animate-pulse rounded-md bg-[hsl(var(--surface-2))]" />
            </div>
          </div>

          {/* Static Help Text */}
          <div className="sm:col-span-2">
            <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
              Help / reset access
            </div>
            <div className="mt-2 text-[15px] font-semibold text-[hsl(var(--fg))]">
              If you lost your password, request a reset with your teacher.
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function StudentProfilePage() {
  const pathname = usePathname();
  const [me, setMe] = useState<StudentMeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/student/me');
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        const candidate = unwrapField(json, 'student');
        setMe(looksLikeStudentMe(candidate) ? candidate : null);
      } catch {
        setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell navItems={studentNavItems} currentPath={pathname}>
      {/* 
         Static PageHeader for a better experience. 
         We don't need to show 'Loading...' in the subtitle anymore 
         because the Skeleton below tells the story.
      */}
      <PageHeader title="Profile" />

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
              <CardDescription>Your student details</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Name
                </div>
                <div className="mt-2 text-[17px] font-semibold text-[hsl(var(--fg))]">
                  {me.name}
                </div>
              </div>

              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Username
                </div>
                <div className="mt-2 text-[17px] font-semibold text-[hsl(var(--fg))]">
                  {me.username}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Help / reset access
                </div>
                <div className="mt-2 text-[15px] font-semibold text-[hsl(var(--fg))]">
                  If you lost your password, request a reset with your teacher.
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}
    </AppShell>
  );
}
