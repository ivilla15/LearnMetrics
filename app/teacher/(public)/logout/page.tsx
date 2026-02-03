'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Section,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  useToast,
} from '@/components';

export default function TeacherLogoutPage() {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/teacher/logout', { method: 'POST' });
        if (!cancelled) {
          if (!res.ok) toast('Logout failed', 'error');
          else {
            toast('Logged out.', 'success');
            router.push('/');
            router.refresh();
          }
        }
      } catch {
        if (!cancelled) toast('Logout failed', 'error');
      } finally {
        if (!cancelled) {
          router.push('/');
          router.refresh();
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Logging out…</CardTitle>
          <CardDescription>One moment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    </Section>
  );
}
