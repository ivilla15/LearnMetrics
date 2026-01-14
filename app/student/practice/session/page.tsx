'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Section,
  Button,
} from '@/components';
import {
  QuestionCard,
  AppPage,
  TestSidebar,
  makePracticeQuestions,
  gradePractice,
  PracticeQuestion,
} from '@/modules';
import { cn } from '@/lib';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function StudentPracticeSessionPage() {
  const router = useRouter();
  const params = useSearchParams();

  const level = clamp(Number(params.get('level') ?? 3), 1, 12);
  const count = clamp(Number(params.get('count') ?? 30), 6, 40);
  const minutes = clamp(Number(params.get('minutes') ?? 4), 0, 30); // 0 = off

  const [questions, setQuestions] = useState<PracticeQuestion[]>(() =>
    makePracticeQuestions(level, count),
  );

  const [answers, setAnswers] = useState<Record<number, number | ''>>({});
  const [submitting, setSubmitting] = useState(false);

  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof gradePractice> | null>(null);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // timer
  const [now, setNow] = useState(Date.now());
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    // if params change (back/forward), regenerate deterministically-ish
    setQuestions(makePracticeQuestions(level, count));
    setAnswers({});
    setFinished(false);
    setResult(null);
    setSubmitting(false);
    setStartedAt(Date.now());
    setNow(Date.now());
  }, [level, count, minutes]);

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

  const jumpTo = useCallback((qId: number) => {
    const el = inputRefs.current[qId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => el.focus());
  }, []);

  const answeredCount = useMemo(() => {
    return questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;
  }, [answers, questions]);

  const submit = useCallback(() => {
    if (submitting || finished) return;

    setSubmitting(true);

    // instant (no API)
    const graded = gradePractice(questions, answers);

    setResult(graded);
    setFinished(true);
    setSubmitting(false);
  }, [answers, finished, questions, submitting]);

  // auto-submit when time hits 0 (only if timer is on)
  useEffect(() => {
    if (minutes <= 0) return;
    if (finished) return;
    if (msLeft > 0) return;
    submit();
  }, [finished, minutes, msLeft, submit]);

  // focus first question on mount / regen
  useEffect(() => {
    requestAnimationFrame(() => {
      const first = questions[0];
      if (!first) return;
      inputRefs.current[first.id]?.focus();
    });
  }, [questions]);

  // -----------------------------
  // Results screen
  // -----------------------------
  if (finished && result) {
    const incorrect = result.items.filter((i) => !i.isCorrect);

    return (
      <AppPage
        title="Practice results"
        subtitle="Nothing was saved — practice anytime."
        width="wide"
      >
        <Section>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your score</CardTitle>
                <CardDescription>
                  Level {level} · {count} questions ·{' '}
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
                          className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3"
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
                  <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4 text-sm text-[hsl(var(--fg))]">
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
                    setQuestions(makePracticeQuestions(level, count));
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

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push('/student/dashboard')}
                >
                  Back to dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>
      </AppPage>
    );
  }

  // -----------------------------
  // Active session screen
  // -----------------------------
  return (
    <AppPage
      title="Practice"
      subtitle={`Level ${level} · ${count} questions${minutes > 0 ? ` · ${minutes} min` : ''}`}
      width="wide"
    >
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
                      const nextQ = questions[i + 1];
                      if (nextQ) jumpTo(nextQ.id);
                      else submit();
                    }}
                  />
                );
              })}
            </div>
          </main>

          {/* SIDEBAR (same API as assignment page) */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <TestSidebar
              title="Practice"
              description="Jump to any question."
              timeRemainingMs={minutes > 0 ? msLeft : 0}
              answeredCount={answeredCount}
              totalCount={questions.length}
              submitting={submitting}
              submitLabel="Submit"
              onSubmit={submit}
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
                          'h-9 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-xs font-semibold text-[hsl(var(--fg))] transition',
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
                onClick={() => router.push('/student/practice')}
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
