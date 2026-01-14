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
  Input,
  Label,
  HelpText,
  useToast,
} from '@/components';

export default function StudentActivatePage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  function normalizeSetupCode(raw: string) {
    return raw.replace(/\D/g, '').slice(0, 6);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const u = username.trim();
    const c = setupCode.trim();
    const p = newPassword.trim();
    if (!u || !c || !p) return;

    if (c.length !== 6) return toast('Setup code must be 6 digits', 'error');
    if (p.length < 8) return toast('Password must be at least 8 characters', 'error');

    try {
      setBusy(true);

      const res = await fetch('/api/student/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, setupCode: c, newPassword: p }),
      });

      const j = await res.json().catch(() => null);

      if (!res.ok) {
        return toast(typeof j?.error === 'string' ? j.error : 'Activation failed', 'error');
      }

      toast('Account activated. Welcome!', 'success');
      router.replace('/student/dashboard');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentAuthShell closeHref="/student/login">
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
        <CardHeader>
          <CardTitle>First-time setup</CardTitle>
          <CardDescription>Enter your setup code and choose a new password.</CardDescription>
        </CardHeader>

        <CardContent className="py-6 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="setupCode">Setup code</Label>
              <Input
                id="setupCode"
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
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
              />
              <HelpText>At least 8 characters.</HelpText>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={
                busy ||
                !username.trim() ||
                setupCode.trim().length !== 6 ||
                newPassword.trim().length < 8
              }
              className="w-full"
            >
              {busy ? 'Activating…' : 'Activate'}
            </Button>

            <HelpText>If your setup code expired, ask your teacher to reset your access.</HelpText>
          </form>
        </CardContent>
      </Card>
    </StudentAuthShell>
  );
}
