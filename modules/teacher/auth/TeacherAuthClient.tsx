'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Button, useToast, Pill } from '@/components';
import { AuthSplitShell, type AuthMode } from '@/modules/auth/_components/AuthSplitShell';
import { teacherLogin, teacherSignup } from './actions';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

function safeNext(next?: string) {
  if (typeof next === 'string' && next.startsWith('/')) return next;
  return '/teacher/classrooms';
}

function LoginForm({
  busy,
  onBusyChange,
  next,
}: {
  busy: boolean;
  onBusyChange: (v: boolean) => void;
  next?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return toast('Email is required', 'error');
    if (!password) return toast('Password is required', 'error');

    try {
      onBusyChange(true);
      await teacherLogin({ email: trimmedEmail, password });
      toast('Welcome back.', 'success');
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="t-email">Email</Label>
        <Input
          id="t-email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="t-password">Password</Label>
        <Input
          id="t-password"
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
    </form>
  );
}

function SignupForm({
  busy,
  onBusyChange,
  next,
}: {
  busy: boolean;
  onBusyChange: (v: boolean) => void;
  next?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) return toast('Name is required', 'error');
    if (!trimmedEmail) return toast('Email is required', 'error');
    if (!password || password.length < 8) {
      return toast('Password must be at least 8 characters', 'error');
    }

    try {
      onBusyChange(true);
      await teacherSignup({ name: trimmedName, email: trimmedEmail, password });
      toast('Account created.', 'success');
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Signup failed', 'error');
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="t-name">Name</Label>
        <Input
          id="t-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="t-email2">Email</Label>
        <Input
          id="t-email2"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="t-password2">Password</Label>
        <Input
          id="t-password2"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  );
}

export default function TeacherAuthClient({
  next,
  initialMode,
}: {
  next?: string;
  initialMode: AuthMode;
}) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="min-h-screen w-screen bg-[hsl(var(--bg))] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-4">
        <div className="text-center md:text-left">
          <div className="flex flex-wrap gap-2 align-items center justify-center md:justify-start">
            <LearnMetricsLogo variant="icon-blue" href="/" />
            {Pill('Teacher portal', 'primary', 'md')}
          </div>
          <div className="mt-3 text-3xl font-semibold text-[hsl(var(--fg))]">
            Access LearnMetrics
          </div>
          <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
            Manage classrooms, schedules, and progress reports.
          </div>
        </div>

        <AuthSplitShell
          mode={mode}
          onChangeMode={(m) => {
            if (!busy) setMode(m);
          }}
          loginForm={<LoginForm busy={busy} onBusyChange={setBusy} next={next} />}
          signupForm={<SignupForm busy={busy} onBusyChange={setBusy} next={next} />}
          overlayLogin={{
            title: 'New here?',
            body: 'Create a teacher account to start your free trial and set up your first classroom.',
            cta: 'Create account',
            bullets: [
              'Create your first classroom',
              'Add students in seconds',
              'Run weekly tests automatically',
            ],
          }}
          overlaySignup={{
            title: 'Already have an account?',
            body: 'Sign in to manage your classrooms, schedules, and student progress.',
            cta: 'Sign in',
            bullets: [
              'View class progress instantly',
              'Assign make-up tests',
              'Print student login cards',
            ],
          }}
        />
      </div>
    </div>
  );
}
