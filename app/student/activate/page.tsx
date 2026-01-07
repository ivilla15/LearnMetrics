'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentShell } from '@/app/api/student/StudentShell';
import { useToast } from '@/components/ToastProvider';

export default function StudentActivatePage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  function normalizeSetupCode(raw: string) {
    // keep digits only, max 6 chars
    return raw.replace(/\D/g, '').slice(0, 6);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const u = username.trim();
    const c = setupCode.trim();
    const p = newPassword.trim();

    if (!u || !c || !p) return;

    // quick client-side validation so we don’t spam the server
    if (c.length !== 6) {
      toast('Setup code must be 6 digits', 'error');
      return;
    }
    if (p.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      setBusy(true);

      const res = await fetch('/api/student/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u,
          setupCode: c,
          newPassword: p,
        }),
      });

      const j = await res.json().catch(() => null);

      if (!res.ok) {
        toast(typeof j?.error === 'string' ? j.error : 'Activation failed', 'error');
        return;
      }

      toast('Account activated. Welcome!', 'success');

      // ✅ after activation you are already signed in (cookie set by /api/student/activate)
      router.replace('/student');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudentShell
      title="First-time setup"
      subtitle="Enter your setup code and choose a new password."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="username" className="text-xs font-medium text-slate-200">
            Username
          </label>
          <input
            id="username"
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={busy}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="setupCode" className="text-xs font-medium text-slate-200">
            Setup code
          </label>
          <input
            id="setupCode"
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none font-mono tracking-wider"
            placeholder="6-digit code"
            value={setupCode}
            onChange={(e) => setSetupCode(normalizeSetupCode(e.target.value))}
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={busy}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="newPassword" className="text-xs font-medium text-slate-200">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={busy}
          />
          <p className="text-[11px] text-slate-400">At least 8 characters.</p>
        </div>

        <button
          type="submit"
          disabled={
            busy ||
            !username.trim() ||
            setupCode.trim().length !== 6 ||
            newPassword.trim().length < 8
          }
          className="h-11 w-full rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy ? 'Activating' : 'Activate'}
        </button>

        <p className="text-xs text-slate-400">
          If your setup code expired, ask your teacher to reset your access.
        </p>
      </form>
    </StudentShell>
  );
}
