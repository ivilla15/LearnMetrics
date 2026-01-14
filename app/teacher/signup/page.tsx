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
  HelpText,
  Button,
  useToast,
} from '@/components';

export default function TeacherSignupPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedCode = signupCode.trim();

    if (!trimmedName) return toast('Name is required', 'error');
    if (!trimmedEmail) return toast('Email is required', 'error');
    if (!trimmedCode) return toast('Signup code is required', 'error');
    if (!password || password.length < 6)
      return toast('Password must be at least 6 characters', 'error');

    try {
      setBusy(true);

      const res = await fetch('/api/teacher/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          signupCode: trimmedCode,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast(json?.error ?? 'Signup failed', 'error');
        return;
      }

      toast('Account created.', 'success');
      router.push('/teacher/classrooms');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Create teacher account</CardTitle>
          <CardDescription>Private beta signup (requires a code).</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ms. Johnson"
              />
            </div>

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
              <Label htmlFor="signupCode">Signup code</Label>
              <Input
                id="signupCode"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                placeholder="Provided by admin"
              />
              <HelpText>This is required while teacher signup is gated.</HelpText>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>

            <div className="text-xs text-[hsl(var(--muted-fg))]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/teacher/login')}
                className="font-semibold text-[hsl(var(--fg))] underline underline-offset-4"
              >
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Section>
  );
}
