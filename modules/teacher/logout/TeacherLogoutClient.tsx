'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Section, useToast } from '@/components';
import { LogoutCard } from '@/modules/auth/_components/LogoutCard';
import { teacherLogout } from '@/modules/teacher/auth/actions';

export default function TeacherLogoutClient() {
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await teacherLogout();
        if (!cancelled) toast('Logged out.', 'success');
      } catch (err) {
        if (!cancelled) toast(err instanceof Error ? err.message : 'Logout failed', 'error');
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
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-10">
      <LogoutCard />
    </Section>
  );
}
