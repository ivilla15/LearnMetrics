'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  Modal,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  HelpText,
  Input,
  Label,
  StatPill,
  pctTone,
  BarRow,
  MiniBar,
  Badge,
} from '@/components';

import { formatLocal } from '@/lib/date';
import { ClassroomProgressDTO, FactDetailDTO, FilterKey, MissedFact } from '@/types';
import { AssignMakeupTestModal } from '@/modules';

type Props = {
  classroomId: number;
  initial: ClassroomProgressDTO;
};

export function ClassroomProgressClient({ classroomId, initial }: Props) {
  const router = useRouter();

  const [data, setData] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  // Students-table filters
  const [filter, setFilter] = React.useState<FilterKey>('all');
  const [search, setSearch] = React.useState('');

  // Student picker modal search (separate from table search)
  const [pickerSearch, setPickerSearch] = React.useState('');

  // Modals
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [missedOpen, setMissedOpen] = React.useState(false);
  const [missedDetailOpen, setMissedDetailOpen] = React.useState(false);

  // Missed-fact detail
  const [factLoading, setFactLoading] = React.useState(false);
  const [selectedFact, setSelectedFact] = React.useState<MissedFact | null>(null);
  const [factDetail, setFactDetail] = React.useState<FactDetailDTO | null>(null);

  const studentsTableRef = React.useRef<HTMLDivElement | null>(null);

  const [assignOpen, setAssignOpen] = React.useState(false);

  async function reload(nextDays: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/progress?days=${nextDays}`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load');
      setData(json as ClassroomProgressDTO);
    } finally {
      setLoading(false);
    }
  }

  // --- Derived data ---
  const students = React.useMemo(() => {
    return data.students ?? [];
  }, [data.students]);

  const focusStudents = React.useMemo(() => {
    return data.focus?.students ?? [];
  }, [data.focus?.students]);

  const last3Tests = React.useMemo(() => {
    return data.recent?.last3Tests ?? [];
  }, [data.recent?.last3Tests]);

  const missedFacts = React.useMemo(() => {
    return data.insights?.topMissedFacts ?? [];
  }, [data.insights?.topMissedFacts]);

  const hasMissedFacts = missedFacts.some((m) => (m.incorrectCount ?? 0) > 0);

  const top3Missed = missedFacts.slice(0, 3);
  const restMissed = missedFacts.slice(3);
  const maxIncorrect = missedFacts.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0);

  const scoreBuckets = data.charts?.scoreBuckets ?? [];
  const maxBucket = scoreBuckets.reduce((m, r) => Math.max(m, r.count), 0);

  const levelBuckets = data.charts?.levelBuckets ?? [];
  const maxLevelBucket = levelBuckets.reduce((m, r) => Math.max(m, r.count), 0);
  const [daysText, setDaysText] = React.useState(String(initial?.range?.days ?? 30));

  React.useEffect(() => {
    if (data?.range?.days) setDaysText(String(data.range.days));
  }, [data?.range?.days]);

  // --- High-value addition #1: Participation rate ---
  // Count distinct students who attempted at least once in range.
  const participation = React.useMemo(() => {
    const attemptedIds = new Set<number>();
    for (const s of students) {
      if ((s?.attemptsInRange ?? 0) > 0) attemptedIds.add(s.id);
    }
    const attemptedCount = attemptedIds.size;
    const total = students.length;
    const pct = total > 0 ? Math.round((attemptedCount / total) * 100) : 0;

    return { attemptedCount, total, pct };
  }, [students]);
  const lastTestMeta = React.useMemo(
    () =>
      last3Tests[0]
        ? { numQuestions: last3Tests[0].numQuestions, windowMinutes: 4, questionSetId: null }
        : null,
    [last3Tests],
  );

  const hasLastTest = last3Tests.length > 0;

  const missedLastTestCount = Number.isFinite(data?.summary?.missedLastTestCount)
    ? (data.summary!.missedLastTestCount as number)
    : null;

  // --- Students filtering ---
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return students.filter((s) => {
      if (q) {
        const hay = `${s.name} ${s.username}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      switch (filter) {
        case 'atRisk':
          return !!s.flags?.atRisk;
        case 'stale14':
          return !!s.flags?.stale14Days;
        case 'streak2':
          return !!s.flags?.nonMasteryStreak2;
        case 'masteryStreak2':
          return (s.masteryStreak ?? 0) >= 2;
        case 'needsSetup':
          return !!s.flags?.needsSetup;
        case 'improving':
          return s.trendLast3 === 'improving';
        case 'regressing':
          return s.trendLast3 === 'regressing';
        case 'missedLastTest':
          return !!s.flags?.missedLastTest;
        default:
          return true;
      }
    });
  }, [students, filter, search]);

  const masteryStreak2Count = React.useMemo(() => {
    return students.reduce((acc, s) => acc + ((s.masteryStreak ?? 0) >= 2 ? 1 : 0), 0);
  }, [students]);

  const pickerList = React.useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const hay = `${s.name} ${s.username}`.toLowerCase();
      return hay.includes(q);
    });
  }, [students, pickerSearch]);

  // Apply days range
  function applyDays() {
    const parsed = Number(daysText);
    const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;

    setFilter('all');
    setSearch('');

    reload(safe);
  }

  function scrollToStudentsTable() {
    requestAnimationFrame(() => {
      studentsTableRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  async function openFactDetail(fact: MissedFact) {
    setSelectedFact(fact);
    setFactDetail(null);
    setMissedDetailOpen(true);

    if (!fact?.questionId) return;

    setFactLoading(true);
    try {
      const days = Number(data?.range?.days) || 30;
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/progress?questionId=${fact.questionId}&days=${days}`,
        { cache: 'no-store' },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load');

      setFactDetail(json as FactDetailDTO);
    } finally {
      setFactLoading(false);
    }
  }

  const factRows = factDetail?.students ?? [];
  const factMaxIncorrect = factRows.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 1) Summary cards */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Class Progress</CardTitle>
              <CardDescription>
                Actionable insights for the last {data?.range?.days ?? 30} days.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setPickerSearch('');
                  setPickerOpen(true);
                }}
              >
                View student
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAssignOpen(true);
                }}
              >
                Assign test
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Action stats */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill
              label="At-risk students"
              value={data?.summary?.atRiskCount ?? 0}
              tone="danger"
              onClick={() => {
                setFilter('atRisk');
                scrollToStudentsTable();
              }}
            />

            <StatPill
              label="Missed last test"
              value={missedLastTestCount ?? 0}
              tone="warning"
              onClick={() => {
                setFilter('missedLastTest');
                scrollToStudentsTable();
              }}
            />
            <StatPill
              label="2+ Mastery streak"
              tone="success"
              value={masteryStreak2Count}
              onClick={() => {
                setFilter('masteryStreak2');
                scrollToStudentsTable();
              }}
            />
            <StatPill
              label="2+ non-mastery streak"
              tone="warning"
              value={data?.summary?.nonMasteryStreak2Count ?? 0}
              onClick={() => {
                setFilter('streak2');
                scrollToStudentsTable();
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill
              label="Participation (range)"
              value={`${participation.attemptedCount}/${participation.total} (${participation.pct}%)`}
              onClick={() => {
                setFilter('all');
                scrollToStudentsTable();
              }}
            />

            <StatPill
              label="Lowest recent %"
              value={
                data.summary?.lowestRecentPercent == null
                  ? '—'
                  : `${data.summary.lowestRecentPercent}%`
              }
            />

            <StatPill
              label="Mastery rate (range)"
              value={`${data?.summary?.masteryRateInRange ?? 0}%`}
            />

            <StatPill
              label="Average score (range)"
              value={`${data?.summary?.avgPercentInRange ?? 0}%`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill label="Highest level" value={data?.summary?.highestLevel ?? '—'} />

            <StatPill label="Division Students" value="0" />

            <StatPill label="Attempts (range)" value={data?.summary?.attemptsInRange ?? 0} />

            <StatPill
              label="Students total"
              value={data?.summary?.studentsTotal ?? students.length}
            />
          </div>

          <HelpText>
            Range affects: score buckets, missed facts, and range-based flags
            (median/mastery/attempts). Streaks, last attempt, and last-3 trend use a longer recent
            window.
          </HelpText>

          {/* Today’s focus */}
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">Today’s Focus</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                  Prioritized students who need attention right now.
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setFilter('atRisk')}>
                Filter at-risk
              </Button>
            </div>

            {focusStudents.length === 0 ? (
              <div className="mt-3 text-sm text-[hsl(var(--muted-fg))]">
                No urgent flags in this range.
              </div>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {focusStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      router.push(`/teacher/classrooms/${classroomId}/students/${s.id}/progress`)
                    }
                    className={[
                      'text-left rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] px-3 py-3 transition-colors',
                      'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">{s.name}</div>
                    <div className="text-xs font-mono text-[hsl(var(--muted-fg))]">
                      {s.username}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Badge({ text: `Lvl ${s.level}`, tone: 'muted' })}
                    </div>
                    <div className="mt-2 text-xs text-[hsl(var(--muted-fg))]">
                      Last attempt: {formatLocal(s.lastAttemptAt ?? null)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Last 3 tests */}
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Last 3 tests</div>
            <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
              Quick snapshot of recent performance.
            </div>

            {last3Tests.length === 0 ? (
              <div className="mt-3 text-sm text-[hsl(var(--muted-fg))]">
                No tests in this range yet.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {last3Tests.map((t) => (
                  <div
                    key={t.assignmentId}
                    className="rounded-[14px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                      {formatLocal(t.opensAt)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Badge({ text: `${t.assignmentMode}`, tone: 'muted' })}
                      {Badge({ text: `${t.numQuestions} Q`, tone: 'muted' })}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Mastery</div>
                        <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                          {t.masteryRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Attempted</div>
                        <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                          {t.attemptedCount}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Avg</div>
                        <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                          {t.avgPercent}%
                        </div>
                      </div>
                    </div>

                    {t.missedCount !== undefined ? (
                      <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
                        Missed: {t.missedCount}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <HelpText>
            “At-risk” includes: no attempts in range, 14+ days since last attempt, 2+ non-mastery
            streak, or median score &lt; 70% in range.
          </HelpText>
        </CardContent>
      </Card>

      {/* 2) Score distribution */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>How attempts are clustered by score range.</CardDescription>
        </CardHeader>

        <CardContent>
          {scoreBuckets.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">
              No attempts in this range yet.
            </div>
          ) : (
            <div className="space-y-3">
              {scoreBuckets.map((b) => (
                <BarRow key={b.label} label={b.label} value={b.count} max={maxBucket} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3) Level distribution */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Level Distribution</CardTitle>
          <CardDescription>Current student levels across the class.</CardDescription>
        </CardHeader>

        <CardContent>
          {levelBuckets.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
          ) : (
            <div className="space-y-3">
              {levelBuckets.map((b) => (
                <BarRow
                  key={b.level}
                  label={`Lvl ${b.level}`}
                  value={b.count}
                  max={maxLevelBucket}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4) Most missed facts */}
      {hasMissedFacts ? (
        <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Most Missed Facts</CardTitle>
              <CardDescription>
                Based on incorrect AttemptItems in the selected range.
              </CardDescription>
            </div>

            {restMissed.length > 0 ? (
              <Button variant="secondary" onClick={() => setMissedOpen(true)}>
                View all
              </Button>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-3">
            {top3Missed.map((m) => (
              <button
                key={`${m.factorA}x${m.factorB}`}
                type="button"
                onClick={() => openFactDetail(m)}
                className={[
                  'w-full text-left rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 transition-colors',
                  'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                      {m.factorA} × {m.factorB} = {m.answer}
                    </div>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                      Incorrect {m.incorrectCount}/{m.totalCount} ({m.errorRate}% error)
                    </div>
                    <div className="mt-2 text-[11px] text-[hsl(var(--muted-fg))]">
                      Click to see which students missed this.
                    </div>
                  </div>

                  <div className="w-45">
                    <MiniBar value={m.incorrectCount} max={maxIncorrect} />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>

          {/* View all modal */}
          <Modal
            open={missedOpen}
            onClose={() => setMissedOpen(false)}
            title="Most missed facts"
            description="Full list for the selected range. Click a fact for student details."
            size="lg"
            footer={
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setMissedOpen(false)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[hsl(var(--surface-2))] border-b border-[hsl(var(--border))] text-left">
                      <th className="py-3 pl-4 pr-3">Fact</th>
                      <th className="py-3 px-3 text-right">Incorrect</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 pl-3 pr-4 text-right">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missedFacts.map((m) => (
                      <tr
                        key={`${m.factorA}x${m.factorB}`}
                        className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))] cursor-pointer"
                        onClick={() => openFactDetail(m)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openFactDetail(m);
                          }
                        }}
                      >
                        <td className="py-3 pl-4 pr-3 font-medium text-[hsl(var(--fg))]">
                          {m.factorA} × {m.factorB} = {m.answer}
                        </td>
                        <td className="py-3 px-3 text-right">{m.incorrectCount}</td>
                        <td className="py-3 px-3 text-right">{m.totalCount}</td>
                        <td className="py-3 pl-3 pr-4 text-right">{m.errorRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <HelpText>
                Tip: The student detail view requires an API route that returns per-student miss
                counts for a question.
              </HelpText>
            </div>
          </Modal>

          {/* Missed-fact detail modal */}
          <Modal
            open={missedDetailOpen}
            onClose={() => {
              setMissedDetailOpen(false);
              setSelectedFact(null);
              setFactDetail(null);
            }}
            title={
              selectedFact
                ? `Who missed ${selectedFact.factorA} × ${selectedFact.factorB}?`
                : 'Who missed this fact?'
            }
            description="Per-student counts for this fact within the selected range."
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMissedDetailOpen(false);
                    setSelectedFact(null);
                    setFactDetail(null);
                  }}
                >
                  Close
                </Button>
              </div>
            }
          >
            {factLoading ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
            ) : !factDetail ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                No detail loaded. (Check API route / response.)
              </div>
            ) : factRows.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                No student misses recorded for this fact in the selected range.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
                  <div className="text-sm font-semibold text-[hsl(var(--fg))]">Totals</div>
                  <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                    Incorrect: {factDetail.totalIncorrect} • Attempts containing this fact:{' '}
                    {factDetail.totalAttempts}
                  </div>
                </div>

                <div className="space-y-3">
                  {factRows.map((r) => (
                    <button
                      key={r.studentId}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/teacher/classrooms/${classroomId}/students/${r.studentId}/progress`,
                        )
                      }
                      className={[
                        'w-full text-left rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 transition-colors',
                        'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                            {r.name}
                          </div>
                          <div className="text-xs font-mono text-[hsl(var(--muted-fg))]">
                            {r.username}
                          </div>
                          <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                            Incorrect {r.incorrectCount}/{r.totalCount}
                          </div>
                        </div>

                        <div className="w-45">
                          <MiniBar value={r.incorrectCount} max={factMaxIncorrect} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <HelpText>Click a student to open their progress report.</HelpText>
              </div>
            )}
          </Modal>
        </Card>
      ) : null}

      {/* 5) Students */}
      <div ref={studentsTableRef}>
        <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Filters apply only to this table.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1">
                <Label htmlFor="days">Range (days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    inputMode="numeric"
                    value={daysText}
                    onChange={(e) => setDaysText(e.target.value)}
                    className="w-27.5"
                  />

                  <Button variant="secondary" onClick={applyDays} disabled={loading}>
                    {loading ? 'Loading…' : 'Apply'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-1 min-w-60">
                <Label htmlFor="search">Search students</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or username…"
                />
              </div>

              <div className="grid gap-1">
                <Label>Filter</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['all', 'All'],
                      ['atRisk', 'At-risk'],
                      ['stale14', '14+ days'],
                      ['missedLastTest', 'Missed last test'],
                      ['streak2', '2+ not mastery'],
                      ['masteryStreak2', '2+ mastery'],
                      ['needsSetup', 'Needs setup'],
                      ['improving', 'Improving'],
                      ['regressing', 'Regressing'],
                    ] as Array<[FilterKey, string]>
                  ).map(([key, label]) => {
                    const active = filter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={[
                          'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                          active
                            ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setFilter('all');
                      setSearch('');
                    }}
                    className="cursor-pointer rounded-[999px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--surface-2))]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
                    <th className="py-3 pl-5 pr-3">Student</th>
                    <th className="py-3 px-3 text-center">Level</th>
                    <th className="py-3 px-3">Last attempt</th>
                    <th className="py-3 px-3 text-center">Last %</th>
                    <th className="py-3 px-3 text-center">Avg %</th>
                    <th className="py-3 px-3 text-center">Mastery %</th>
                    <th className="py-3 px-3 text-center">Streak</th>
                    <th className="py-3 px-3">Trend</th>
                    <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 px-3 text-center text-[hsl(var(--muted-fg))]"
                      >
                        No students match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))]"
                      >
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="text-[hsl(var(--fg))] font-medium">{s.name}</div>
                            <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">
                              {s.username}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {s.flags?.needsSetup ? (
                                <Badge tone="warning">Needs setup</Badge>
                              ) : (
                                <Badge tone="success">Active</Badge>
                              )}
                              {s.flags?.atRisk && <Badge tone="danger">At-risk</Badge>}
                              {s.flags?.stale14Days && <Badge tone="warning">14+ days</Badge>}
                              {s.flags?.nonMasteryStreak2 && (
                                <Badge tone="warning">2+ not mastery</Badge>
                              )}
                              {s.flags?.missedLastTest && (
                                <Badge tone="warning">Missed last test</Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">{s.level}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            <div>{formatLocal(s.lastAttemptAt)}</div>
                            {hasLastTest ? (
                              s.flags?.missedLastTest ? (
                                <Badge tone="warning">Missing</Badge>
                              ) : s.flags?.lastTestMastery ? (
                                <Badge tone="success">Mastered</Badge>
                              ) : s.flags?.lastTestAttempted ? (
                                <Badge tone="danger">Not mastered</Badge>
                              ) : (
                                <Badge tone="muted">—</Badge>
                              )
                            ) : (
                              <Badge tone="muted">—</Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {s.lastPercent === null ? (
                            '—'
                          ) : (
                            <span className="inline-flex justify-center">
                              <Badge tone={pctTone(s.lastPercent)}>{s.lastPercent}%</Badge>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {s.avgPercentInRange === null ? (
                            '—'
                          ) : (
                            <span className="inline-flex justify-center">
                              <Badge tone={pctTone(s.avgPercentInRange)}>
                                {s.avgPercentInRange}%
                              </Badge>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {s.masteryRateInRange === null ? (
                            '—'
                          ) : (
                            <span className="inline-flex justify-center">
                              <Badge tone={pctTone(s.masteryRateInRange)}>
                                {s.masteryRateInRange}%
                              </Badge>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {s.masteryStreak > 0 ? (
                            <Badge tone="success">M{s.masteryStreak}</Badge>
                          ) : s.nonMasteryStreak > 0 ? (
                            <Badge tone="danger">N{s.nonMasteryStreak}</Badge>
                          ) : (
                            <Badge tone="warning">0</Badge>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {s.trendLast3 === 'improving' ? (
                            <Badge tone="success">Improving</Badge>
                          ) : s.trendLast3 === 'regressing' ? (
                            <Badge tone="warning">Regressing</Badge>
                          ) : s.trendLast3 === 'flat' ? (
                            <Badge tone="muted">Flat</Badge>
                          ) : (
                            <Badge tone="muted">Need 3 attempts</Badge>
                          )}
                        </td>

                        <td className="py-3 pl-3 pr-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/teacher/classrooms/${classroomId}/students/${s.id}/progress`,
                                )
                              }
                            >
                              View
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/teacher/classrooms/${classroomId}/students/${s.id}/progress?print=1`,
                                )
                              }
                            >
                              Print report
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <HelpText>
              Next upgrade: “Print report” should open a print-friendly report layout route.
            </HelpText>
          </CardContent>
        </Card>
      </div>

      <AssignMakeupTestModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        classroomId={classroomId}
        students={students}
        lastTestMeta={lastTestMeta}
        onCreated={async () => {
          const days = Number(data?.range?.days) || 30;
          await reload(days);
        }}
      />

      {/* Student picker modal */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Open student progress"
        description="Choose a student to view their detailed progress report."
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="picker-search">Search</Label>
            <Input
              id="picker-search"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Name or username…"
            />
          </div>

          <div className="max-h-90 overflow-auto rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
            {pickerList.length === 0 ? (
              <div className="p-4 text-sm text-[hsl(var(--muted-fg))]">No matches.</div>
            ) : (
              <div className="divide-y divide-[hsl(var(--border))]">
                {pickerList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      router.push(`/teacher/classrooms/${classroomId}/students/${s.id}/progress`);
                    }}
                    className="w-full text-left p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors"
                  >
                    <div className="text-sm font-semibold text-[hsl(var(--fg))]">{s.name}</div>
                    <div className="text-xs text-[hsl(var(--muted-fg))] font-mono">
                      {s.username}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <HelpText>
            Tip: student picker is independent from the Students table search/filters.
          </HelpText>
        </div>
      </Modal>
    </div>
  );
}
