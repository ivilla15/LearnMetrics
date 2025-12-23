'use client';

import { useParams, useRouter } from 'next/navigation';
import { StudentShell } from '@/app/api/student/StudentShell';
import { useToast } from '@/components/ToastProvider';
import { useEffect, useMemo, useRef, useState } from 'react';

type LoadResponse =
  | { status: 'NOT_OPEN' | 'CLOSED'; assignment: any }
  | { status: 'ALREADY_SUBMITTED'; assignment: any; result: any }
  | {
      status: 'READY';
      student: any;
      assignment: any;
      questions: { id: number; factorA: number; factorB: number }[];
    };

function formatLocal(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function msToClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function StudentAssignmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const assignmentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LoadResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | ''>>({});

  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoSubmittedRef = useRef(false);

  const assignment = (data as any)?.assignment;

  // Load assignment state
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const res = await fetch(`/api/student/assignments/${assignmentId}`);
      const json = (await res.json().catch(() => null)) as LoadResponse | null;

      if (cancelled) return;

      if (!res.ok || !json) {
        toast('Could not load test', 'error');
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    }

    if (assignmentId) load();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, toast]);

  // When we enter READY, reset local UI state + allow future auto-submit
  useEffect(() => {
    if (data?.status === 'READY') {
      setIndex(0);
      setAnswers({});
      autoSubmittedRef.current = false;

      // focus first question input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [data?.status]);

  // Countdown ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!assignment?.closesAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [assignment?.closesAt]);

  const msLeft = useMemo(() => {
    if (!assignment?.closesAt) return 0;
    return new Date(assignment.closesAt).getTime() - now;
  }, [assignment?.closesAt, now]);

  // Auto-submit ONCE when time hits 0 (READY only)
  useEffect(() => {
    if (data?.status !== 'READY') return;
    if (msLeft > 0) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    void handleSubmit(true);
  }, [msLeft, data?.status]);

  // Focus input whenever question index changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  // Warn before leaving during READY
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (data?.status !== 'READY') return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [data?.status]);

  async function handleSubmit(isAuto = false) {
    if (submitting) return;
    if (!data || data.status !== 'READY') return;

    const qs = data.questions;
    const payload = qs.map((q) => ({
      questionId: q.id,
      givenAnswer: answers[q.id] === '' ? null : Number(answers[q.id]),
    }));

    try {
      setSubmitting(true);

      const res = await fetch(`/api/student/assignments/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast(json?.error ?? 'Submit failed', 'error');
        return;
      }

      toast(isAuto ? 'Time is up. Submitted.' : 'Submitted.', 'success');
      router.push('/student/dashboard');
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------
  // Render states
  // -----------------------------
  if (loading) {
    return <StudentShell title="Test">Loading</StudentShell>;
  }

  if (!data) {
    return (
      <StudentShell title="Test">
        <div className="text-sm text-slate-300">Unable to load.</div>
      </StudentShell>
    );
  }

  if (data.status === 'NOT_OPEN') {
    return (
      <StudentShell title="Test not open yet" subtitle="Come back when the test window opens.">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
          <div className="font-semibold">Opens</div>
          <div className="mt-1 text-slate-300">{formatLocal(assignment.opensAt)}</div>
        </div>
      </StudentShell>
    );
  }

  if (data.status === 'CLOSED') {
    return (
      <StudentShell title="Test closed" subtitle="This test window is over.">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
          <div className="font-semibold">Closed</div>
          <div className="mt-1 text-slate-300">{formatLocal(assignment.closesAt)}</div>
        </div>
      </StudentShell>
    );
  }

  if (data.status === 'ALREADY_SUBMITTED') {
    return (
      <StudentShell title="Already submitted" subtitle="You already completed this test.">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
          <div className="font-semibold">Score</div>
          <div className="mt-1 text-slate-300">
            {data.result.score}/{data.result.total} ({data.result.percent}%)
          </div>
        </div>
      </StudentShell>
    );
  }

  if (data.status !== 'READY') {
    return (
      <StudentShell title="Test">
        <div className="text-sm text-slate-300">Unexpected state.</div>
      </StudentShell>
    );
  }

  // READY
  const questions = data.questions;
  const q = questions[index];
  const currentValue = answers[q.id] ?? '';
  const isLast = index === questions.length - 1;

  const answeredCount = questions.filter(
    (x) => answers[x.id] !== undefined && answers[x.id] !== '',
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs text-slate-300">Time remaining</div>
            <div className="text-2xl font-semibold tracking-tight">{msToClock(msLeft)}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
              Answered {answeredCount}/{questions.length}
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit(false)}
              disabled={submitting}
              className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main question card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Question {index + 1}</div>
            <div className="text-xs text-slate-300">
              {formatLocal(assignment.opensAt)} → {formatLocal(assignment.closesAt)}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-10">
            <div className="text-5xl font-semibold tracking-tight">
              {q.factorA} × {q.factorB}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor={`answer-${q.id}`} className="text-xs font-medium text-slate-200">
              Your answer
            </label>
            <input
              ref={inputRef}
              id={`answer-${q.id}`}
              inputMode="numeric"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-lg text-white outline-none focus:border-white/20"
              value={currentValue}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();

                if (isLast) void handleSubmit(false);
                else setIndex((i) => Math.min(questions.length - 1, i + 1));
              }}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  setAnswers((prev) => ({ ...prev, [q.id]: '' }));
                  return;
                }
                if (!/^\d+$/.test(v)) return;
                setAnswers((prev) => ({ ...prev, [q.id]: Number(v) }));
              }}
              placeholder="Type a number"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  void handleSubmit(false);
                  return;
                }
                setIndex((i) => Math.min(questions.length - 1, i + 1));
              }}
              disabled={submitting}
              className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : isLast ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>

        {/* Right sidebar question grid */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <div className="text-sm font-semibold">Questions</div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((x, i) => {
              const done = answers[x.id] !== undefined && answers[x.id] !== '';
              const isActive = i === index;

              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className={[
                    'h-9 rounded-lg text-xs font-semibold',
                    isActive
                      ? 'bg-white text-slate-950'
                      : 'border border-white/10 bg-black/20 text-white',
                    done ? 'ring-2 ring-emerald-400/40' : '',
                  ].join(' ')}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-slate-300">Green ring means answered.</div>
        </div>
      </div>
    </div>
  );
}
