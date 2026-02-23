'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Section,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components';

import { QuestionCard, AppPage, TestSidebar } from '@/modules';
import { cn } from '@/lib';
import { getNumberParam } from '@/utils';

import {
  OPERATION_CODES,
  type OperationCode,
  type GeneratedQuestionDTO,
  type GradeResultDTO,
} from '@/types';

import { generateQuestions, gradeGeneratedQuestions } from '@/core';

import { usePracticeProgress } from '@/modules/student/assignments/hooks/usePracticeProgress';

function PracticeSessionFallback() {
  return (
    <div className="min-h-screen w-screen bg-[hsl(var(--bg))] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl rounded-[32px] border-0 bg-[hsl(var(--card))] shadow-[0_30px_90px_rgba(0,0,0,0.10)] p-6 md:p-10">
        <div className="text-sm text-[hsl(var(--muted-fg))]">Loading practice…</div>
      </div>
    </div>
  );
}

function isOperationCode(v: string): v is OperationCode {
  return (OPERATION_CODES as readonly string[]).includes(v);
}

function parseOpsParam(raw: string | null): OperationCode[] {
  if (!raw) return ['MUL'];

  const ops = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .filter(isOperationCode);

  return ops.length > 0 ? ops : ['MUL'];
}

function formatClock(totalSeconds: number) {
  const sRaw = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const s = Math.max(0, Math.floor(sRaw));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

async function startPracticeTimeSession(params: {
  assignmentId: number;
  operation: OperationCode;
  level: number;
  maxNumber: number;
}) {
  const res = await fetch(
    `/api/student/assignments/${params.assignmentId}/practice-sessions/start`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        operation: params.operation,
        level: params.level,
        maxNumber: params.maxNumber,
      }),
    },
  );

  const json = (await res.json().catch(() => null)) as {
    error?: string;
    sessionId?: number;
  } | null;

  if (!res.ok || !json?.sessionId) {
    throw new Error(json?.error ?? 'Failed to start practice session');
  }

  return json.sessionId;
}

async function heartbeatPracticeTimeSession(params: {
  assignmentId: number;
  sessionId: number;
  deltaSeconds: number;
}) {
  const res = await fetch(
    `/api/student/assignments/${params.assignmentId}/practice-sessions/heartbeat`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId: params.sessionId, deltaSeconds: params.deltaSeconds }),
    },
  );

  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(json?.error ?? 'Failed to update practice session');
}

async function endPracticeTimeSession(params: { assignmentId: number; sessionId: number }) {
  const res = await fetch(`/api/student/assignments/${params.assignmentId}/practice-sessions/end`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId: params.sessionId }),
  });

  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(json?.error ?? 'Failed to end practice session');
}

function StudentPracticeSessionInner() {
  const router = useRouter();
  const params = useSearchParams();

  const level = getNumberParam(params, 'level', 3, 1, 12);
  const count = getNumberParam(params, 'count', 30, 6, 40);
  const minutes = getNumberParam(params, 'minutes', 4, 0, 30);

  const assignmentIdParam = params.get('assignmentId');
  const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : null;
  const isPracticeTimeAssignment = Number.isFinite(assignmentId) && (assignmentId ?? 0) > 0;

  const opsRaw = params.get('ops');
  const fractionsFlag = params.get('fractions') === '1';
  const decimalsFlag = params.get('decimals') === '1';

  const ops = useMemo(() => parseOpsParam(opsRaw), [opsRaw]);
  const primaryOp = ops[0] ?? 'MUL';

  const {
    loading: progressLoading,
    progress: practiceProgress,
    refresh: refreshPracticeProgress,
  } = usePracticeProgress(isPracticeTimeAssignment ? (assignmentId as number) : null);

  const [questions, setQuestions] = useState<GeneratedQuestionDTO[]>(() =>
    generateQuestions({
      seed: Date.now(),
      operation: primaryOp,
      level,
      maxNumber: 12,
      count,
    }),
  );

  const [answers, setAnswers] = useState<Record<number, number | ''>>({});
  const [submitting, setSubmitting] = useState(false);

  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<GradeResultDTO | null>(null);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const sessionIdRef = useRef<number | null>(null);
  const lastHeartbeatAtRef = useRef<number>(Date.now());
  const elapsedThisSessionSecRef = useRef<number>(0);

  const [elapsedThisSessionSec, setElapsedThisSessionSec] = useState(0);

  useEffect(() => {
    setQuestions(
      generateQuestions({
        seed: Date.now(),
        operation: primaryOp,
        level,
        maxNumber: 12,
        count,
      }),
    );

    setAnswers({});
    setFinished(false);
    setResult(null);
    setSubmitting(false);

    setStartedAt(Date.now());
    setNow(Date.now());
  }, [level, count, minutes, primaryOp, fractionsFlag, decimalsFlag]);

  const msLeft = useMemo(() => {
    if (minutes <= 0) return Infinity;
    const duration = minutes * 60 * 1000;
    const end = startedAt + duration;
    return end - now;
  }, [minutes, now, startedAt]);

  useEffect(() => {
    if (minutes <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [minutes]);

  useEffect(() => {
    if (!isPracticeTimeAssignment) return;

    const t = setInterval(() => {
      elapsedThisSessionSecRef.current += 1;
      setElapsedThisSessionSec(elapsedThisSessionSecRef.current);
    }, 1000);

    return () => clearInterval(t);
  }, [isPracticeTimeAssignment]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!isPracticeTimeAssignment) return;

      sessionIdRef.current = null;
      lastHeartbeatAtRef.current = Date.now();
      elapsedThisSessionSecRef.current = 0;
      setElapsedThisSessionSec(0);

      try {
        const sessionId = await startPracticeTimeSession({
          assignmentId: assignmentId as number,
          operation: primaryOp,
          level,
          maxNumber: 12,
        });

        if (cancelled) return;
        sessionIdRef.current = sessionId;
      } catch {}
    }

    void start();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, isPracticeTimeAssignment, primaryOp, level]);

  useEffect(() => {
    if (!isPracticeTimeAssignment) return;

    const t = setInterval(async () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      const nowMs = Date.now();
      const delta = Math.floor((nowMs - lastHeartbeatAtRef.current) / 1000);
      if (delta <= 0) return;

      lastHeartbeatAtRef.current = nowMs;

      try {
        if (!assignmentId) return;

        await heartbeatPracticeTimeSession({
          assignmentId,
          sessionId,
          deltaSeconds: delta,
        });

        void refreshPracticeProgress();
      } catch {}
    }, 12_000);

    return () => clearInterval(t);
  }, [isPracticeTimeAssignment, assignmentId, refreshPracticeProgress]);

  useEffect(() => {
    if (!isPracticeTimeAssignment) return;

    async function flushAndEnd() {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      const nowMs = Date.now();
      const delta = Math.floor((nowMs - lastHeartbeatAtRef.current) / 1000);
      lastHeartbeatAtRef.current = nowMs;

      try {
        if (!assignmentId) return;
        if (delta > 0) {
          await heartbeatPracticeTimeSession({
            assignmentId,
            sessionId,
            deltaSeconds: delta,
          });
        }

        await endPracticeTimeSession({
          assignmentId,
          sessionId,
        });
      } catch {
      } finally {
        void refreshPracticeProgress();
      }
    }

    function onBeforeUnload() {
      void flushAndEnd();
    }

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      void flushAndEnd();
    };
  }, [isPracticeTimeAssignment, assignmentId, refreshPracticeProgress]);

  const jumpTo = useCallback((qId: number) => {
    const el = inputRefs.current[qId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => el.focus());
  }, []);

  const answeredCount = useMemo(() => {
    return questions.filter((_, idx) => answers[idx] !== undefined && answers[idx] !== '').length;
  }, [answers, questions]);

  const submit = useCallback(() => {
    if (submitting || finished) return;

    setSubmitting(true);

    const graded = gradeGeneratedQuestions({
      questions,
      answersByIndex: answers,
    });

    setResult(graded);
    setFinished(true);
    setSubmitting(false);
  }, [answers, finished, questions, submitting]);

  useEffect(() => {
    if (minutes <= 0) return;
    if (finished) return;
    if (msLeft > 0) return;
    submit();
  }, [finished, minutes, msLeft, submit]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const first = questions[0];
      if (!first) return;
      inputRefs.current[first.id]?.focus();
    });
  }, [questions]);

  if (finished && result) {
    const incorrect = result.items.filter((item) => !item.isCorrect);

    return (
      <AppPage
        title="Practice results"
        subtitle={
          isPracticeTimeAssignment
            ? 'Your practice time was recorded.'
            : 'Nothing was saved — practice anytime.'
        }
        width="wide"
      >
        <Section>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your score</CardTitle>
                <CardDescription>
                  {primaryOp} · Level {level} · {count} questions ·{' '}
                  {minutes === 0 ? 'Timer off' : `${minutes} minutes`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-5xl font-semibold tracking-tight text-[hsl(var(--fg))]">
                  {result.percent}%
                </div>

                <div className="text-sm text-[hsl(var(--muted-fg))]">
                  {result.score}/{result.total} correct
                </div>

                {isPracticeTimeAssignment ? (
                  <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4 text-sm">
                    <div className="text-xs text-[hsl(var(--muted-fg))]">This session time</div>
                    <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                      {formatClock(elapsedThisSessionSec)}
                    </div>
                    <div className="mt-2 text-xs text-[hsl(var(--muted-fg))]">
                      Total updates based on multiple sessions during the assignment window.
                    </div>
                  </div>
                ) : null}

                {incorrect.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                      Missed questions
                    </div>
                    <div className="space-y-2">
                      {incorrect.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] p-3"
                        >
                          <div className="font-medium text-[hsl(var(--fg))]">{it.prompt}</div>
                          <div className="text-sm text-[hsl(var(--muted-fg))]">
                            Your answer: {it.studentAnswer === -1 ? '—' : it.studentAnswer} ·
                            Correct: {it.correctAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4 text-sm text-[hsl(var(--fg))]">
                    Perfect score — nice work.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
                <CardDescription>Keep practicing or head back</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  size="lg"
                  onClick={() => {
                    setAnswers({});
                    setFinished(false);
                    setResult(null);
                    setQuestions(
                      generateQuestions({
                        seed: Date.now(),
                        operation: primaryOp,
                        level,
                        maxNumber: 12,
                        count,
                      }),
                    );
                    setStartedAt(Date.now());
                    setNow(Date.now());
                  }}
                >
                  Practice again
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    router.push(
                      isPracticeTimeAssignment ? '/student/dashboard' : '/student/practice',
                    )
                  }
                >
                  {isPracticeTimeAssignment ? 'Back to dashboard' : 'Change settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>
      </AppPage>
    );
  }

  // Active session screen
  const completedMin = practiceProgress ? Math.floor(practiceProgress.completedSeconds / 60) : null;
  const requiredMin = practiceProgress ? Math.floor(practiceProgress.requiredSeconds / 60) : null;

  return (
    <AppPage
      title="Practice"
      subtitle={`${primaryOp} · Level ${level} · ${count} questions${
        minutes > 0 ? ` · ${minutes} min` : ''
      }`}
      width="wide"
    >
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            {isPracticeTimeAssignment ? (
              <Card className="shadow-sm">
                <CardContent className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        Practice-time assignment
                      </div>
                      <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
                        {progressLoading
                          ? 'Loading total…'
                          : practiceProgress && completedMin !== null && requiredMin !== null
                            ? `${completedMin} / ${requiredMin} minutes total`
                            : 'Total unavailable'}
                        {' · '}
                        {`This session: ${formatClock(elapsedThisSessionSec)}`}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void refreshPracticeProgress()}
                      disabled={progressLoading}
                    >
                      Refresh
                    </Button>
                  </div>

                  {practiceProgress ? (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-2))]">
                      <div
                        className="h-full bg-[hsl(var(--brand))]"
                        style={{ width: `${practiceProgress.percent}%` }}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              {questions.map((q, i) => {
                const value = answers[i] ?? '';
                const done = value !== '';

                return (
                  <QuestionCard
                    key={q.id}
                    index={i}
                    factorA={q.operandA}
                    factorB={q.operandB}
                    value={value}
                    isAnswered={done}
                    inputRef={(el) => {
                      inputRefs.current[q.id] = el;
                    }}
                    onChange={(next) => setAnswers((prev) => ({ ...prev, [i]: next }))}
                    onEnter={() => {
                      const nextQ = questions[i + 1];
                      if (nextQ) jumpTo(nextQ.id);
                      else submit();
                    }}
                  />
                );
              })}
            </div>
          </main>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <TestSidebar
              title="Practice"
              description={
                minutes > 0
                  ? `Time left: ${formatClock(Math.ceil(msLeft / 1000))}`
                  : 'Jump to any question.'
              }
              timeRemainingMs={minutes > 0 ? msLeft : 0}
              answeredCount={answeredCount}
              totalCount={questions.length}
              submitting={submitting}
              submitLabel="Submit"
              onSubmit={submit}
              questionButtons={
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const done = answers[i] !== undefined && answers[i] !== '';
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
              footerHint={
                minutes > 0
                  ? 'Blue ring means unanswered. Auto-submits when time runs out.'
                  : 'Blue ring means unanswered.'
              }
            />

            <div className="mt-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  router.push(isPracticeTimeAssignment ? '/student/dashboard' : '/student/practice')
                }
                disabled={submitting}
              >
                Exit practice
              </Button>
            </div>
          </aside>
        </div>
      </Section>
    </AppPage>
  );
}

export default function StudentPracticeSessionPage() {
  return (
    <Suspense fallback={<PracticeSessionFallback />}>
      <StudentPracticeSessionInner />
    </Suspense>
  );
}
