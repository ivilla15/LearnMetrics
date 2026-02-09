'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components';
import { AuthLogoutShell } from '@/modules/auth/_components/AuthLogoutShell';

export default function StudentLogoutClient() {
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/student/logout', { method: 'POST' });
        if (!cancelled && !res.ok) toast('Logout failed', 'error');
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
      pillText="Student portal"
      title="Logging out…"
      subtitle="Clearing your student session."
      hint="If you are not redirected, go to Home."
      toHref="/"
    />
  );
}
