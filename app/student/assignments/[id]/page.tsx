'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, CardContent, Section, Skeleton, useToast } from '@/components';
import { QuestionCard, TestSidebar, AppPage } from '@/modules';
import { cn, formatLocal } from '@/lib';

type AssignmentPayload = {
  id: number;
  kind: string;
  mode: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
};

type StudentPayload = {
  id: number;
  name: string;
  level: number;
};

type AlreadySubmittedResult = {
  score: number;
  total: number;
  percent: number;
  completedAt: string;
};

type QuestionPayload = {
  id: number;
  factorA: number;
  factorB: number;
};

type LoadResponse =
  | { status: 'NOT_OPEN' | 'CLOSED'; assignment: AssignmentPayload }
  | { status: 'ALREADY_SUBMITTED'; assignment: AssignmentPayload; result: AlreadySubmittedResult }
  | {
      status: 'READY';
      student: StudentPayload;
      assignment: AssignmentPayload;
      questions: QuestionPayload[];
    };

function getAssignment(data: LoadResponse | null): AssignmentPayload | null {
  return data ? data.assignment : null;
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
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const autoSubmittedRef = useRef(false);

  const assignment = getAssignment(data);
  const readyQuestions = data?.status === 'READY' ? data.questions : null;

  function jumpTo(qId: number) {
    const el = inputRefs.current[qId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => el.focus());
  }

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

    if (assignmentId) void load();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, toast]);

  // Countdown ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!assignment?.closesAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [assignment?.closesAt]);

  const msLeft = useMemo(() => {
    if (!assignment?.closesAt) return 0;
    const raw = new Date(assignment.closesAt).getTime() - now;
    return Math.max(0, raw);
  }, [assignment?.closesAt, now]);

  const handleSubmit = useCallback(
    async (isAuto = false) => {
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

        const json = (await res.json().catch(() => null)) as { error?: string } | null;

        if (!res.ok) {
          toast(json?.error ?? 'Submit failed', 'error');
          return;
        }

        toast(isAuto ? 'Time is up. Submitted.' : 'Submitted.', 'success');
        router.push('/student/dashboard');
      } finally {
        setSubmitting(false);
      }
    },
    [answers, assignmentId, data, router, submitting, toast],
  );

  useEffect(() => {
    if (!readyQuestions?.length) return;

    setAnswers({});
    autoSubmittedRef.current = false;

    requestAnimationFrame(() => {
      const first = readyQuestions[0];
      if (!first) return;
      inputRefs.current[first.id]?.focus();
    });
  }, [readyQuestions]);

  useEffect(() => {
    if (data?.status !== 'READY') return;
    if (msLeft > 0) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    void handleSubmit(true);
  }, [msLeft, data?.status, handleSubmit]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (data?.status !== 'READY') return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [data?.status]);

  if (loading) {
    return (
      <AppPage title="Test" subtitle="Loading your test…">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-10 flex flex-col items-center justify-center gap-3">
              <div className="text-sm text-[hsl(var(--muted-fg))]">Loading test…</div>
              <Skeleton className="h-2 w-40 rounded-full" />
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (!data) {
    return (
      <AppPage title="Test">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-8 text-sm text-[hsl(var(--muted-fg))]">
              Unable to load.
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (!assignment) {
    return (
      <AppPage title="Test">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-8 text-sm text-[hsl(var(--muted-fg))]">
              Missing assignment data.
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (data.status === 'NOT_OPEN') {
    return (
      <AppPage title="Test not open yet" subtitle="Come back when the test window opens.">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-6 space-y-1">
              <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Opens</div>
              <div className="text-base font-semibold text-[hsl(var(--fg))]">
                {formatLocal(assignment.opensAt)}
              </div>
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (data.status === 'CLOSED') {
    return (
      <AppPage title="Test closed" subtitle="This test window is over.">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-6 space-y-1">
              <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Closed</div>
              <div className="text-base font-semibold text-[hsl(var(--fg))]">
                {formatLocal(assignment.closesAt)}
              </div>
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (data.status === 'ALREADY_SUBMITTED') {
    return (
      <AppPage title="Already submitted" subtitle="You already completed this test.">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-6 space-y-2">
              <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Score</div>
              <div className="text-3xl font-semibold tracking-tight text-[hsl(var(--fg))]">
                {data.result.percent}%
              </div>
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                {data.result.score}/{data.result.total}
              </div>
              <div className="pt-2">
                <Button variant="secondary" onClick={() => router.push('/student/progress')}>
                  View details
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  if (data.status !== 'READY') {
    return (
      <AppPage title="Test">
        <Section>
          <Card className="shadow-sm">
            <CardContent className="py-8 text-sm text-[hsl(var(--muted-fg))]">
              Unexpected state.
            </CardContent>
          </Card>
        </Section>
      </AppPage>
    );
  }

  const questions = data.questions;

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== '',
  ).length;

  return (
    <AppPage title="Test" subtitle="Answer each question, then submit.">
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* MAIN */}
          <main className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {questions.map((q, i) => {
                const value = answers[q.id] ?? '';
                const done = value !== '';

                return (
                  <QuestionCard
                    key={q.id}
                    index={i}
                    factorA={q.factorA}
                    factorB={q.factorB}
                    value={value}
                    isAnswered={done}
                    inputRef={(el) => {
                      inputRefs.current[q.id] = el;
                    }}
                    onChange={(next) => setAnswers((prev) => ({ ...prev, [q.id]: next }))}
                    onEnter={() => {
                      const next = questions[i + 1];
                      if (next) jumpTo(next.id);
                      else void handleSubmit(false);
                    }}
                  />
                );
              })}
            </div>
          </main>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <TestSidebar
              title="Questions"
              description="Jump to any question."
              timeRemainingMs={msLeft}
              answeredCount={answeredCount}
              totalCount={questions.length}
              submitting={submitting}
              submitLabel="Submit"
              onSubmit={() => void handleSubmit(false)}
              questionButtons={
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const done = answers[q.id] !== undefined && answers[q.id] !== '';
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => jumpTo(q.id)}
                        className={cn(
                          'h-9 rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] text-xs font-semibold text-[hsl(var(--fg))] transition',
                          'hover:bg-[hsl(var(--surface-2))]',
                          done ? '' : 'ring-1 ring-[hsl(var(--brand)/0.25)]',
                        )}
                        title={done ? 'Answered' : 'Unanswered'}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              }
              footerHint="Blue ring means unanswered."
            />
          </aside>
        </div>
      </Section>
    </AppPage>
  );
}
