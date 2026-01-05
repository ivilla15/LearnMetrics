'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      await fetch('/api/student/logout', { method: 'POST' });
      router.replace('/');
    }

    logout();
  }, [router]);

  return <p className="p-6 text-slate-300">Signing out…</p>;
}
