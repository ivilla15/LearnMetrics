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
  type AnswerValue,
  ProgressionModifier,
} from '@/types';

import { usePracticeProgress } from '@/modules/student/assignments/hooks/usePracticeProgress';
import {
  generateQuestions,
  gradeGeneratedQuestions,
  getMaxUniqueQuestionsFor,
} from '@/core/questions';

function PracticeSessionFallback() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[hsl(var(--bg))] p-4 md:p-8">
      <div className="w-full max-w-5xl rounded-4xl border-0 bg-[hsl(var(--card))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.10)] md:p-10">
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

function getModifierFromFlags(params: {
  fractionsFlag: boolean;
  decimalsFlag: boolean;
}): ProgressionModifier {
  if (params.fractionsFlag) return 'FRACTION';
  if (params.decimalsFlag) return 'DECIMAL';
  return null;
}

function parseFractionInput(raw: string): AnswerValue | null {
  const match = raw.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return {
    kind: 'fraction',
    numerator: Math.trunc(numerator),
    denominator: Math.trunc(denominator),
  };
}

function parseAnswerInput(raw: string, modifier: ProgressionModifier): AnswerValue | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (modifier === 'FRACTION') {
    const fraction = parseFractionInput(trimmed);
    if (fraction) return fraction;

    const whole = Number(trimmed);
    if (!Number.isFinite(whole)) return null;

    return {
      kind: 'fraction',
      numerator: Math.trunc(whole),
      denominator: 1,
    };
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;

  return { kind: 'decimal', value: numeric };
}

function formatAnswerValue(value: AnswerValue | null): string {
  if (!value) return '—';
  if (value.kind === 'fraction') return `${value.numerator}/${value.denominator}`;
  return String(value.value);
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

async function endPracticeTimeSession(params: {
  assignmentId: number;
  sessionId: number;
  score: number;
  total: number;
}): Promise<{ qualified: boolean; scorePercent: number }> {
  const res = await fetch(`/api/student/assignments/${params.assignmentId}/practice-sessions/end`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      sessionId: params.sessionId,
      score: params.score,
      total: params.total,
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    error?: string;
    qualified?: boolean;
    scorePercent?: number;
  } | null;
  if (!res.ok) throw new Error(json?.error ?? 'Failed to end practice session');

  return {
    qualified: json?.qualified ?? false,
    scorePercent: json?.scorePercent ?? 0,
  };
}

function clampedCount(params: {
  operation: OperationCode;
  level: number;
  maxNumber: number;
  modifier: ProgressionModifier;
  count: number;
}): number {
  const available = getMaxUniqueQuestionsFor({
    operation: params.operation,
    level: params.level,
    maxNumber: params.maxNumber,
    modifier: params.modifier,
  });
  return Math.min(params.count, available);
}

function StudentPracticeSessionInner() {
  const router = useRouter();
  const params = useSearchParams();

  const level = getNumberParam(params, 'level', 3, 1, 12);
  const count = getNumberParam(params, 'count', 30, 6, 40);
  const minutes = getNumberParam(params, 'minutes', 4, 0, 120);
  const maxNumber = getNumberParam(params, 'maxNumber', 12, 1, 100);

  const assignmentIdParam = params.get('assignmentId');
  const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : null;
  const isPracticeTimeAssignment = Number.isFinite(assignmentId) && (assignmentId ?? 0) > 0;

  const opsRaw = params.get('ops');
  const fractionsFlag = params.get('fractions') === '1';
  const decimalsFlag = params.get('decimals') === '1';
  const modifier = getModifierFromFlags({ fractionsFlag, decimalsFlag });

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
      maxNumber,
      count: clampedCount({ operation: primaryOp, level, maxNumber, modifier, count }),
      modifier,
    }),
  );

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<GradeResultDTO | null>(null);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const sessionIdRef = useRef<number | null>(null);

  // set-qualified result for the most recently ended assignment set
  const [lastSetQualified, setLastSetQualified] = useState<boolean | null>(null);

  useEffect(() => {
    setQuestions(
      generateQuestions({
        seed: Date.now(),
        operation: primaryOp,
        level,
        maxNumber,
        count: clampedCount({ operation: primaryOp, level, maxNumber, modifier, count }),
        modifier,
      }),
    );

    setAnswers({});
    setFinished(false);
    setResult(null);
    setSubmitting(false);

    setStartedAt(Date.now());
    setNow(Date.now());
  }, [level, count, minutes, primaryOp, modifier, maxNumber]);

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
    let cancelled = false;

    async function start() {
      if (!isPracticeTimeAssignment) return;

      sessionIdRef.current = null;

      try {
        const sessionId = await startPracticeTimeSession({
          assignmentId: assignmentId as number,
          operation: primaryOp,
          level,
          maxNumber,
        });

        if (cancelled) return;
        sessionIdRef.current = sessionId;
      } catch {}
    }

    void start();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, isPracticeTimeAssignment, primaryOp, level, maxNumber]);

  // Anti-copy/paste + session integrity for practice-time assignments
  useEffect(() => {
    if (!isPracticeTimeAssignment || finished) return;

    function blockClipboard() {
      return (e: ClipboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target instanceof HTMLInputElement) return;
        e.preventDefault();
      };
    }

    const onCopy = blockClipboard();
    const onCut = blockClipboard();
    const onPaste = blockClipboard();

    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    };
  }, [isPracticeTimeAssignment, finished]);

  // No heartbeat needed for set-based assignments — score is submitted on set completion.

  const jumpTo = useCallback((qId: number) => {
    const el = inputRefs.current[qId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => el.focus());
  }, []);

  const answeredCount = useMemo(() => {
    return questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length;
  }, [answers, questions]);

  const submit = useCallback(async () => {
    if (submitting || finished) return;

    setSubmitting(true);

    const answersByIndex: Record<number, AnswerValue | null> = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const raw = q ? (answers[q.id] ?? '') : '';
      answersByIndex[i] = parseAnswerInput(raw, modifier);
    }

    const graded = gradeGeneratedQuestions({
      questions,
      answersByIndex,
    });

    if (isPracticeTimeAssignment && assignmentId && sessionIdRef.current) {
      try {
        const endResult = await endPracticeTimeSession({
          assignmentId,
          sessionId: sessionIdRef.current,
          score: graded.score,
          total: graded.total,
        });
        setLastSetQualified(endResult.qualified);
        void refreshPracticeProgress();
      } catch {
        setLastSetQualified(null);
      }
      sessionIdRef.current = null;
    }

    setResult(graded);
    setFinished(true);
    setSubmitting(false);
  }, [
    answers,
    finished,
    questions,
    submitting,
    modifier,
    isPracticeTimeAssignment,
    assignmentId,
    refreshPracticeProgress,
  ]);

  useEffect(() => {
    if (minutes <= 0) return;
    if (finished) return;
    if (msLeft > 0) return;
    void submit();
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
            ? 'Set complete — see if it qualified below.'
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

                {incorrect.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                      Missed questions
                    </div>
                    <div className="space-y-2">
                      {incorrect.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-(--radius) border-0 bg-[hsl(var(--surface-2))] p-3 shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                        >
                          <div className="font-medium text-[hsl(var(--fg))]">{it.prompt}</div>
                          <div className="text-sm text-[hsl(var(--muted-fg))]">
                            Your answer: {formatAnswerValue(it.studentAnswer)} · Correct:{' '}
                            {formatAnswerValue(it.correctAnswer)}
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
                <CardDescription>
                  {isPracticeTimeAssignment
                    ? 'Keep going or head back'
                    : 'Keep practicing or head back'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {isPracticeTimeAssignment ? (
                  <>
                    {lastSetQualified !== null ? (
                      <div
                        className={[
                          'rounded-(--radius) p-3 text-sm font-medium',
                          lastSetQualified
                            ? 'bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))]'
                            : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))]',
                        ].join(' ')}
                      >
                        {lastSetQualified
                          ? 'This set qualified.'
                          : 'This set did not meet the minimum score — try again.'}
                      </div>
                    ) : null}

                    {practiceProgress ? (
                      <div className="text-sm text-[hsl(var(--muted-fg))]">
                        {practiceProgress.completedSets} / {practiceProgress.requiredSets}{' '}
                        qualifying sets · {practiceProgress.minimumScorePercent}% minimum
                      </div>
                    ) : null}

                    {practiceProgress &&
                    practiceProgress.completedSets >= practiceProgress.requiredSets ? (
                      <div className="text-sm font-medium text-[hsl(var(--brand))]">
                        All qualifying sets completed!
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        onClick={async () => {
                          setAnswers({});
                          setFinished(false);
                          setResult(null);
                          setLastSetQualified(null);
                          setQuestions(
                            generateQuestions({
                              seed: Date.now(),
                              operation: primaryOp,
                              level,
                              maxNumber,
                              count: clampedCount({
                                operation: primaryOp,
                                level,
                                maxNumber,
                                modifier,
                                count,
                              }),
                              modifier,
                            }),
                          );
                          setStartedAt(Date.now());
                          setNow(Date.now());

                          if (assignmentId) {
                            try {
                              const sessionId = await startPracticeTimeSession({
                                assignmentId,
                                operation: primaryOp,
                                level,
                                maxNumber,
                              });
                              sessionIdRef.current = sessionId;
                            } catch {}
                          }
                        }}
                      >
                        Start next set
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() =>
                        router.push(
                          assignmentId
                            ? `/student/assignments/${assignmentId}`
                            : '/student/dashboard',
                        )
                      }
                    >
                      Back to assignment
                    </Button>
                  </>
                ) : (
                  <>
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
                            maxNumber,
                            count: clampedCount({
                              operation: primaryOp,
                              level,
                              maxNumber,
                              modifier,
                              count,
                            }),
                            modifier,
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
                      onClick={() => router.push('/student/practice')}
                    >
                      Change settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Practice"
      subtitle={`${primaryOp} · Level ${level} · ${count} questions${
        modifier === 'FRACTION' ? ' · Fractions' : modifier === 'DECIMAL' ? ' · Decimals' : ''
      }${minutes > 0 ? ` · ${minutes} min` : ''}`}
      width="wide"
    >
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            {isPracticeTimeAssignment ? (
              <Card className="shadow-sm">
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        Practice assignment
                      </div>
                      <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
                        {progressLoading
                          ? 'Loading…'
                          : practiceProgress
                            ? `${practiceProgress.completedSets} / ${practiceProgress.requiredSets} qualifying sets · ${practiceProgress.minimumScorePercent}% minimum`
                            : 'Progress unavailable'}
                      </div>
                    </div>
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
                const value = answers[q.id] ?? '';
                const done = value.trim() !== '';

                return (
                  <QuestionCard
                    key={q.id}
                    index={i}
                    operation={q.operation}
                    operandA={q.operandA}
                    operandB={q.operandB}
                    value={value}
                    answerMode={modifier}
                    isAnswered={done}
                    inputRef={(el) => {
                      inputRefs.current[q.id] = el;
                    }}
                    onChange={(next) => setAnswers((prev) => ({ ...prev, [q.id]: next }))}
                    onEnter={() => {
                      const nextQ = questions[i + 1];
                      if (nextQ) jumpTo(nextQ.id);
                      else void submit();
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
              onSubmit={() => void submit()}
              questionButtons={
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const done = (answers[q.id] ?? '').trim() !== '';
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => jumpTo(q.id)}
                        className={cn(
                          'h-9 rounded-(--radius) border-0 bg-[hsl(var(--surface))] text-xs font-semibold text-[hsl(var(--fg))] shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition',
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
