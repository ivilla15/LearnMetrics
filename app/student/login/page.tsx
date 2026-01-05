// app/student/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentShell } from '@/app/api/student/StudentShell';
import { useToast } from '@/components/ToastProvider';

export default function StudentLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      setBusy(true);

      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        const msg = typeof j?.error === 'string' ? j.error : 'Login failed';
        toast(msg, 'error');
        return;
      }

      toast('Welcome', 'success');
      router.push('/student');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentShell
      title="Student login"
      subtitle="Sign in to take your next test and track your progress."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="username" className="text-xs font-medium text-slate-200">
            Username
          </label>
          <input
            id="username"
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-white/20"
            placeholder="example: jdoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-xs font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-white/20"
            placeholder="your class password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !username.trim() || !password.trim()}
          className="h-11 w-full rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy ? 'Signing in' : 'Sign in'}
        </button>

        <p className="text-xs text-slate-400">
          Ask your teacher if you do not know your login info.
        </p>
      </form>
    </StudentShell>
  );
}
