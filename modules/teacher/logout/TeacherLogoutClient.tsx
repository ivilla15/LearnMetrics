'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components';
import { AuthLogoutShell } from '@/modules/auth/_components/AuthLogoutShell';

export default function TeacherLogoutClient() {
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/teacher/logout', { method: 'POST' });

        if (!cancelled && !res.ok) {
          toast('Logout failed', 'error');
        }
      } catch {
        if (!cancelled) toast('Logout failed', 'error');
      } finally {
        if (!cancelled) {
          router.replace('/');
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
    <AuthLogoutShell
      pillText="Teacher portal"
      title="Logging out…"
      subtitle="Clearing your teacher session."
      hint="If you are not redirected, use your browser back button or go to Home."
      toHref="/"
    />
  );
}
