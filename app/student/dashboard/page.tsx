// app/student/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StudentShell } from '@/app/api/student/StudentShell';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import { StudentNav } from '@/components/StudentNav';

type MeDTO = { id: number; name: string; username: string; level: number };
type NextAssignmentDTO = null | {
  id: number;
  kind: string;
  mode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number;
};

function formatLocal(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function statusFor(a: NextAssignmentDTO) {
  if (!a || !Number.isFinite(a.id)) return { label: 'No upcoming tests', canStart: false };
  const now = Date.now();
  const opens = new Date(a.opensAt).getTime();
  const closes = new Date(a.closesAt).getTime();

  if (now < opens) return { label: 'Not open yet', canStart: false };
  if (now > closes) return { label: 'Closed', canStart: false };
  return { label: 'Open now', canStart: true };
}

type AssignmentStatus = null | 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED';

export default function StudentDashboardPage() {
  const router = useRouter();

  const [nextStatus, setNextStatus] = useState<AssignmentStatus>(null);
  const [me, setMe] = useState<MeDTO | null>(null);
  const [nextAssignment, setNextAssignment] = useState<NextAssignmentDTO>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [meRes, nextRes] = await Promise.all([
        fetch('/api/student/me'),
        fetch('/api/student/next-assignment'),
      ]);

      if (!meRes.ok) {
        setLoading(false);
        return;
      }

      const meJson = await meRes.json();
      const nextJson = await nextRes.json().catch(() => ({ assignment: null }));

      if (cancelled) return;

      setMe(meJson?.student ?? meJson);
      const raw = nextJson?.assignment ?? nextJson ?? null;
      const normalized =
        raw && typeof raw === 'object' && Number.isFinite((raw as any).id)
          ? (raw as NextAssignmentDTO)
          : null;

      setNextAssignment(normalized);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const id = nextAssignment?.id;
      if (!Number.isFinite(id)) {
        setNextStatus(null);
        return;
      }

      const res = await fetch(`/api/student/assignments/${id}`);
      const json = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok || !json) {
        setNextStatus(null);
        return;
      }

      setNextStatus(json.status ?? null);
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [nextAssignment?.id]);

  if (loading) {
    return <StudentShell title="Dashboard">Loading</StudentShell>;
  }

  if (!me) {
    return (
      <StudentShell title="Dashboard" subtitle="Please sign in again.">
        <div className="text-sm text-slate-300">Not signed in.</div>
      </StudentShell>
    );
  }
  const s = statusFor(nextAssignment);

  const id = nextAssignment?.id;
  const hasId = Number.isFinite(id);

  const alreadySubmitted = nextStatus === 'ALREADY_SUBMITTED';
  const buttonLabel = alreadySubmitted ? 'See results' : 'Start test';

  // allow results anytime; otherwise only allow during open window
  const canClick = hasId && (alreadySubmitted || s.canStart);

  return (
    <>
      <StudentNav />
      <div className="space-y-6">
        <StudentShell title={`Welcome, ${me.name}`} subtitle={`Level ${me.level}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-slate-300">Account</div>
              <div className="mt-1 text-sm font-semibold">{me.username}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-slate-300">Next test status</div>
              <div className="mt-1 text-sm font-semibold">{s.label}</div>
            </div>
          </div>
        </StudentShell>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Next test</h2>
              <p className="mt-1 text-sm text-slate-300">
                {nextAssignment
                  ? nextAssignment.mode === 'MANUAL'
                    ? 'Manual test'
                    : 'Weekly scheduled test'
                  : 'No upcoming tests'}
              </p>
            </div>
            <button
              type="button"
              disabled={!canClick}
              className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
              onClick={() => {
                if (!canClick) return;
                router.push(`/student/assignments/${id}`);
              }}
            >
              {buttonLabel}
            </button>
          </div>

          {nextAssignment ? (
            <div className="mt-4 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-slate-400">Opens</div>
                <div className="mt-1 font-medium">{formatLocal(nextAssignment.opensAt)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-slate-400">Closes</div>
                <div className="mt-1 font-medium">{formatLocal(nextAssignment.closesAt)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-slate-400">Duration</div>
                <div className="mt-1 font-medium">{nextAssignment.windowMinutes} minutes</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
