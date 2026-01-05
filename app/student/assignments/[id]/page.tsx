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

  const [answers, setAnswers] = useState<Record<number, number | ''>>({});

  // ✅ map of refs for every question input (used for scrolling + focusing)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      setAnswers({});
      autoSubmittedRef.current = false;

      // focus first question input (after refs mount)
      requestAnimationFrame(() => {
        const first = data.questions[0];
        if (!first) return;
        inputRefs.current[first.id]?.focus();
      });
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

  // Auto-submit ONCE when time hits 0 (READY only)
  useEffect(() => {
    if (data?.status !== 'READY') return;
    if (msLeft > 0) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    void handleSubmit(true);
  }, [msLeft, data?.status]);

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

  function jumpTo(qId: number) {
    const el = inputRefs.current[qId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => el.focus());
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

  // ✅ READY
  const questions = data.questions;

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== '',
  ).length;

  return (
    <StudentShell title="Test">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* MAIN */}
        <main className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {questions.map((q, i) => {
              const value = answers[q.id] ?? '';
              const done = value !== '';

              return (
                <div
                  key={q.id}
                  className={[
                    'rounded-2xl border bg-white/5 p-4 shadow-xl backdrop-blur',
                    done ? 'border-white/10' : 'border-amber-400/30',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">#{i + 1}</div>
                    {done ? (
                      <div className="text-xs font-semibold text-emerald-300">✓ Answered</div>
                    ) : (
                      <div className="text-xs font-medium text-slate-300">Unanswered</div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-2xl font-semibold tracking-tight text-white">
                      {q.factorA} × {q.factorB}
                    </div>
                    <div className="text-xl font-semibold text-slate-300">=</div>
                  </div>

                  <div className="mt-4">
                    <input
                      ref={(el) => {
                        inputRefs.current[q.id] = el;
                      }}
                      inputMode="numeric"
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-lg text-white outline-none focus:border-white/20"
                      value={value}
                      placeholder="Answer"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setAnswers((prev) => ({ ...prev, [q.id]: '' }));
                          return;
                        }
                        if (!/^\d+$/.test(v)) return;
                        setAnswers((prev) => ({ ...prev, [q.id]: Number(v) }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();

                        const next = questions[i + 1];
                        if (next) jumpTo(next.id);
                        else void handleSubmit(false);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-300">Time remaining</div>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {msToClock(msLeft)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
                Answered {answeredCount}/{questions.length}
              </div>

              <button
                type="button"
                onClick={() => void handleSubmit(false)}
                disabled={submitting}
                className="h-10 w-full rounded-xl bg-white text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-sm font-semibold text-white">Questions</div>

              <div className="mt-3 max-h-[calc(100vh-220px)] overflow-auto pr-1">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const done = answers[q.id] !== undefined && answers[q.id] !== '';
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => jumpTo(q.id)}
                        className={[
                          'relative h-9 rounded-lg text-xs font-semibold',
                          'border border-white/10 bg-black/20 text-white hover:bg-black/30',
                          done ? 'ring-2 ring-emerald-400/40' : '',
                        ].join(' ')}
                        title={done ? 'Answered' : 'Unanswered'}
                      >
                        {i + 1}
                        {done && (
                          <span className="absolute -right-1 -top-1 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-300">Green ring and ✓ means answered.</div>
            </div>
          </div>
        </aside>
      </div>
    </StudentShell>
  );
}
