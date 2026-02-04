'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Section,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
  Input,
  Button,
  useToast,
} from '@/components';

export default function TeacherLoginClient({ next }: { next?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return toast('Email is required', 'error');
    if (!password) return toast('Password is required', 'error');

    try {
      setBusy(true);

      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast(json?.error ?? 'Login failed', 'error');
        return;
      }

      toast('Welcome back.', 'success');

      if (next && next.startsWith('/')) router.push(next);
      else router.push('/teacher/classrooms');

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Teacher login</CardTitle>
          <CardDescription>Sign in to manage your classrooms.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="text-xs text-[hsl(var(--muted-fg))]">
              Need an account?{' '}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    next ? `/teacher/signup?next=${encodeURIComponent(next)}` : '/teacher/signup',
                  )
                }
                className="font-semibold text-[hsl(var(--fg))] underline underline-offset-4"
              >
                Create one
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Section>
  );
}
