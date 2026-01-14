'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { StudentAuthShell } from '@/modules';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  useToast,
} from '@/components';

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
        toast(typeof j?.error === 'string' ? j.error : 'Login failed', 'error');
        return;
      }

      toast('Welcome', 'success');
      router.push('/student/dashboard');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentAuthShell closeHref="/">
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
        <CardHeader>
          <CardTitle>Student login</CardTitle>
          <CardDescription>Sign in to take your next test and track your progress.</CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-xs font-medium text-[hsl(var(--muted-fg))]">
                Username
              </label>
              <input
                id="username"
                className="h-11 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm outline-none focus:border-[hsl(var(--ring))]"
                placeholder="example: jdoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-xs font-medium text-[hsl(var(--muted-fg))]">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="h-11 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm outline-none focus:border-[hsl(var(--ring))]"
                placeholder="your class password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={busy || !username.trim() || !password.trim()}
              className="w-full"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-xs text-[hsl(var(--muted-fg))]">
              Ask your teacher if you do not know your login info.
            </p>
          </form>
        </CardContent>
      </Card>
    </StudentAuthShell>
  );
}
