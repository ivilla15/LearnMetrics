'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentAuthShell } from '@/modules';
import { Card, CardContent } from '@/components';

export default function StudentLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      await fetch('/api/student/logout', { method: 'POST' });
      router.replace('/');
    }
    logout();
  }, [router]);

  return (
    <StudentAuthShell>
      <Card>
        <CardContent className="py-8 text-sm text-[hsl(var(--muted-fg))]">Signing out…</CardContent>
      </Card>
    </StudentAuthShell>
  );
}
