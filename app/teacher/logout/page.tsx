'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetch('/api/teacher/logout', { method: 'POST' });
      router.push('/');
    })();
  }, [router]);

  return <p className="p-6">Signing out…</p>;
}
