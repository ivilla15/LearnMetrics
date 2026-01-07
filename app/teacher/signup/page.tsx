'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherSignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setBusy(true);

      const res = await fetch('/api/teacher/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          signupCode: signupCode.trim(),
        }),
      });

      const j = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = typeof j?.error === 'string' ? j.error : 'Signup failed';
        setError(msg);
        return;
      }

      router.push('/teacher/classrooms');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Teacher sign up</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            className="h-11 rounded-lg border px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="h-11 rounded-lg border px-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="h-11 rounded-lg border px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Signup code</label>
          <input
            className="h-11 rounded-lg border px-3"
            value={signupCode}
            onChange={(e) => setSignupCode(e.target.value)}
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-lg bg-black text-white disabled:opacity-60"
        >
          {busy ? 'Creating account' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-600">After signup, log in from the teacher login page.</p>
    </main>
  );
}
