'use client';

import * as React from 'react';

import { Label, Input, Button, HelpText, useToast, Pill } from '@/components';
import { AuthSplitShell, type AuthMode } from '@/modules/auth/_components/AuthSplitShell';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

function LoginForm({ busy, onBusyChange }: { busy: boolean; onBusyChange: (v: boolean) => void }) {
  const toast = useToast();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const u = username.trim();
    const p = password;

    if (!u) return toast('Username is required', 'error');
    if (!p) return toast('Password is required', 'error');

    try {
      onBusyChange(true);

      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast(typeof json?.error === 'string' ? json.error : 'Login failed', 'error');
        return;
      }

      toast('Welcome.', 'success');

      window.location.href = '/student/dashboard';
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="s-username">Username</Label>
        <Input
          id="s-username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="example: jdoe"
          disabled={busy}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="s-password">Password</Label>
        <Input
          id="s-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your class password"
          disabled={busy}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

function normalizeSetupCode(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 6);
}

function ActivateForm({
  busy,
  onBusyChange,
}: {
  busy: boolean;
  onBusyChange: (v: boolean) => void;
}) {
  const toast = useToast();

  const [username, setUsername] = React.useState('');
  const [setupCode, setSetupCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const u = username.trim();
    const c = setupCode.trim();
    const p = newPassword;

    if (!u) return toast('Username is required', 'error');
    if (c.length !== 6) return toast('Setup code must be 6 digits', 'error');
    if (!p || p.trim().length < 8) return toast('Password must be at least 8 characters', 'error');

    try {
      onBusyChange(true);

      const res = await fetch('/api/student/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, setupCode: c, newPassword: p }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast(typeof json?.error === 'string' ? json.error : 'Activation failed', 'error');
        return;
      }

      toast('Account activated. Welcome!', 'success');

      window.location.href = '/student/dashboard';
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="a-username">Username</Label>
        <Input
          id="a-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={busy}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="a-setupCode">Setup code</Label>
        <Input
          id="a-setupCode"
          value={setupCode}
          onChange={(e) => setSetupCode(normalizeSetupCode(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          disabled={busy}
          className="font-mono tracking-wider"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="a-newPassword">New password</Label>
        <Input
          id="a-newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          disabled={busy}
        />
        <HelpText>At least 8 characters.</HelpText>
      </div>

      <Button type="submit" size="lg" className="w-full">
        {busy ? 'Activating…' : 'Activate'}
      </Button>

      <HelpText>If your setup code expired, ask your teacher to reset your access.</HelpText>
    </form>
  );
}

export default function StudentAuthClient({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="min-h-screen w-screen bg-[hsl(var(--bg))] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-4">
        {/* Header (matches teacher pattern: logo + pill + title + subtitle) */}
        <div className="text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <LearnMetricsLogo variant="icon-blue" href="/" />
            {Pill('Student portal', 'primary', 'md')}
          </div>

          <div className="mt-3 text-3xl font-semibold text-[hsl(var(--fg))]">
            Access LearnMetrics
          </div>

          <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
            Sign in to take tests or activate your account for the first time.
          </div>
        </div>

        <AuthSplitShell
          mode={mode}
          onChangeMode={(m) => {
            if (!busy) setMode(m);
          }}
          loginForm={<LoginForm busy={busy} onBusyChange={setBusy} />}
          signupForm={<ActivateForm busy={busy} onBusyChange={setBusy} />}
          overlayLogin={{
            title: 'First time here?',
            body: 'Activate your account using the setup code on your student login card.',
            cta: 'Activate account',
            bullets: ['Enter your username', 'Type the 6-digit setup code', 'Create a password'],
          }}
          overlaySignup={{
            title: 'Already activated?',
            body: 'Sign in to take your next test and see your progress.',
            cta: 'Sign in',
            bullets: ['Take weekly tests', 'See instant results', 'Track progress over time'],
          }}
          copy={{
            signupTab: 'Activate',
            signupTitle: 'First-time setup',
            signupSubtitle: 'Enter your setup code and choose a password.',
            signupFooter: 'Setup codes expire. Ask your teacher to reset your access if needed.',
            loginFooter: 'Ask your teacher if you do not know your login info.',
          }}
        />
      </div>
    </div>
  );
}
