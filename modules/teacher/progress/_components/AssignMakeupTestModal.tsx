'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Modal, Button, Input, Label, HelpText, Badge, useToast, Skeleton } from '@/components';
import type { AssignmentTargetKind } from '@/types/enums';

type StudentLite = {
  id: number;
  name: string;
  username: string;
  flags?: {
    missedLastTest?: boolean;
    needsSetup?: boolean;
  };
};

type LastTestMeta = {
  numQuestions?: number;
  windowMinutes?: number | null;
  questionSetId?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;

  classroomId: number;
  students: StudentLite[];
  loading?: boolean; // Added loading prop

  lastTestMeta: LastTestMeta | null;

  onCreated?: () => void;
  defaultAudience?: AudienceMode;
  defaultSelectedIds?: number[];
};

type AudienceMode = 'MISSED_LAST' | 'ALL' | 'CUSTOM';

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function fromDatetimeLocalValue(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function AssignMakeupTestModal({
  open,
  onClose,
  classroomId,
  students,
  loading = false, // Default to false
  lastTestMeta,
  onCreated,
  defaultAudience,
  defaultSelectedIds,
}: Props) {
  const router = useRouter();

  const eligibleStudents = React.useMemo(
    () => students.filter((s) => !s.flags?.needsSetup),
    [students],
  );

  const missedLastStudents = React.useMemo(
    () => eligibleStudents.filter((s) => !!s.flags?.missedLastTest),
    [eligibleStudents],
  );

  const [targetKind, setTargetKind] = React.useState<AssignmentTargetKind>('ASSESSMENT');
  const [requiredSets, setRequiredSets] = React.useState<number>(3);
  const [minimumScorePercent, setMinimumScorePercent] = React.useState<number>(80);

  const [audience, setAudience] = React.useState<AudienceMode>('MISSED_LAST');
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  const [opensAtText, setOpensAtText] = React.useState(() => toDatetimeLocalValue(new Date()));
  const [closesAtText, setClosesAtText] = React.useState(() =>
    toDatetimeLocalValue(new Date(Date.now() + 4 * 60 * 1000)),
  );
  const [windowMinutes, setWindowMinutes] = React.useState<number>(() => {
    const v = lastTestMeta?.windowMinutes;
    return Number.isFinite(v as number) && (v as number) > 0 ? (v as number) : 4;
  });

  const [numQuestions, setNumQuestions] = React.useState<number>(() => {
    const v = lastTestMeta?.numQuestions;
    return Number.isFinite(v as number) && (v as number) > 0 ? (v as number) : 12;
  });

  const questionSetId = lastTestMeta?.questionSetId ?? undefined;

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toast = useToast();

  // Reset state when opening
  React.useEffect(() => {
    if (!open) return;

    setError(null);
    setTargetKind('ASSESSMENT');
    setRequiredSets(3);
    setMinimumScorePercent(80);
    setAudience(defaultAudience ?? 'MISSED_LAST');
    setSearch('');
    setSelectedIds(new Set(defaultSelectedIds ?? []));

    const now = new Date();

    const wm = (() => {
      const v = lastTestMeta?.windowMinutes;
      return Number.isFinite(v as number) && (v as number) > 0 ? (v as number) : 4;
    })();

    setOpensAtText(toDatetimeLocalValue(now));
    setClosesAtText(toDatetimeLocalValue(new Date(now.getTime() + wm * 60 * 1000)));
    setWindowMinutes(wm);

    const nq = (() => {
      const v = lastTestMeta?.numQuestions;
      return Number.isFinite(v as number) && (v as number) > 0 ? (v as number) : 12;
    })();

    setNumQuestions(nq);
  }, [open, lastTestMeta, defaultAudience, defaultSelectedIds]);

  const filteredEligible = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligibleStudents;
    return eligibleStudents.filter((s) => `${s.name} ${s.username}`.toLowerCase().includes(q));
  }, [eligibleStudents, search]);

  const computedStudentIds = React.useMemo(() => {
    if (audience === 'MISSED_LAST') return missedLastStudents.map((s) => s.id);
    if (audience === 'ALL') return eligibleStudents.map((s) => s.id);
    return Array.from(selectedIds);
  }, [audience, missedLastStudents, eligibleStudents, selectedIds]);

  const selectedCount = computedStudentIds.length;

  const toggleCustom = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function submit() {
    setError(null);

    const opensAt = fromDatetimeLocalValue(opensAtText);
    if (!opensAt) {
      setError('Please enter a valid open date.');
      return;
    }

    const closesAt = fromDatetimeLocalValue(closesAtText);

    if (targetKind === 'PRACTICE_TIME') {
      if (!closesAt) {
        setError('Please enter a valid close date.');
        return;
      }
      if (closesAt <= opensAt) {
        setError('Close time must be after open time.');
        return;
      }
      if (!Number.isFinite(requiredSets) || requiredSets < 1 || requiredSets > 20) {
        setError('Required sets must be between 1 and 20.');
        return;
      }
      if (
        !Number.isFinite(minimumScorePercent) ||
        minimumScorePercent < 1 ||
        minimumScorePercent > 100
      ) {
        setError('Minimum score must be between 1 and 100.');
        return;
      }
    } else {
      if (!closesAt) {
        setError('Please enter a valid close date.');
        return;
      }
      if (closesAt <= opensAt) {
        setError('Close time must be after open time.');
        return;
      }
      if (!Number.isFinite(windowMinutes) || windowMinutes <= 0 || windowMinutes > 60) {
        setError('Window minutes must be between 1 and 60.');
        return;
      }
      if (!Number.isFinite(numQuestions) || numQuestions < 1 || numQuestions > 12) {
        setError('Number of questions must be between 1 and 12.');
        return;
      }
    }

    if (selectedCount < 1) {
      setError('Select at least one student.');
      return;
    }

    const body =
      targetKind === 'PRACTICE_TIME'
        ? {
            targetKind: 'PRACTICE_TIME' as const,
            mode: 'MANUAL' as const,
            opensAt: opensAt.toISOString(),
            closesAt: closesAt!.toISOString(),
            requiredSets,
            minimumScorePercent,
            studentIds: computedStudentIds,
          }
        : {
            targetKind: 'ASSESSMENT' as const,
            mode: 'MANUAL' as const,
            type: 'TEST' as const,
            opensAt: opensAt.toISOString(),
            closesAt: closesAt!.toISOString(),
            windowMinutes,
            numQuestions,
            studentIds: computedStudentIds,
            ...(questionSetId ? { questionSetId } : {}),
          };

    setBusy(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = typeof json?.error === 'string' ? json.error : 'Failed to create assignment';
        throw new Error(msg);
      }

      toast('Successfully created assignment', 'success');

      const createdId = json?.assignment?.id;
      onClose();
      onCreated?.();

      if (typeof createdId === 'number') {
        router.push(`/teacher/classrooms/${classroomId}/assignments/${createdId}`);
      } else {
        router.push(`/teacher/classrooms/${classroomId}/assignments`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create assignment';
      toast(msg, 'error');
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Create manual assignment"
      description="Create a targeted assignment for selected students."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[hsl(var(--muted-fg))]">
            Selected: <span className="font-semibold">{selectedCount}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={busy || selectedCount < 1}>
              {busy ? 'Creating…' : 'Create assignment'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-[14px] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm text-[hsl(var(--danger))]">
            {error}
          </div>
        ) : null}

        {/* Audience Selection */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Who gets this test?</div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'MISSED_LAST', label: 'Missed last test', count: missedLastStudents.length },
              { id: 'ALL', label: 'All eligible', count: eligibleStudents.length },
              { id: 'CUSTOM', label: 'Custom', count: null },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id as AudienceMode)}
                className={[
                  'cursor-pointer rounded-[999px] border px-4 py-1.5 text-sm font-medium transition-all',
                  audience === opt.id
                    ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white shadow-md'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                ].join(' ')}
              >
                {opt.label} {opt.count !== null ? `(${opt.count})` : ''}
              </button>
            ))}
          </div>

          <HelpText>
            Students who <span className="font-medium text-[hsl(var(--fg))]">need setup</span> are
            excluded automatically.
          </HelpText>

          {audience === 'CUSTOM' && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-1.5">
                <Label htmlFor="assign-search">Search students</Label>
                <Input
                  id="assign-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or username…"
                  className="bg-[hsl(var(--surface))]"
                />
              </div>

              <div className="max-h-80 overflow-auto rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm">
                {loading ? (
                  // Custom List Skeletons
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-5 w-5 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : filteredEligible.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[hsl(var(--muted-fg))] italic">
                    No matching students found.
                  </div>
                ) : (
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {filteredEligible.map((s) => {
                      const checked = selectedIds.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(var(--fg))] truncate">
                              {s.name}
                            </div>
                            <div className="text-xs font-mono text-[hsl(var(--muted-fg))] truncate opacity-70">
                              {s.username}
                            </div>
                            {s.flags?.missedLastTest && (
                              <div className="mt-2">
                                <Badge tone="warning">Missed last test</Badge>
                              </div>
                            )}
                          </div>

                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-[hsl(var(--border))] text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]"
                            checked={checked}
                            onChange={() => toggleCustom(s.id)}
                            aria-label={`Select ${s.name}`}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Type Toggle */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Assignment type</div>
          <div className="flex bg-[hsl(var(--surface-2))] p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setTargetKind('ASSESSMENT')}
              className={[
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
                targetKind === 'ASSESSMENT'
                  ? 'bg-[hsl(var(--surface))] text-[hsl(var(--fg))] shadow-sm'
                  : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]',
              ].join(' ')}
            >
              Assessment
            </button>
            <button
              type="button"
              onClick={() => setTargetKind('PRACTICE_TIME')}
              className={[
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
                targetKind === 'PRACTICE_TIME'
                  ? 'bg-[hsl(var(--surface))] text-[hsl(var(--fg))] shadow-sm'
                  : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]',
              ].join(' ')}
            >
              Practice sets
            </button>
          </div>
        </div>

        {/* Configuration Settings */}
        <div className="space-y-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2)/0.3)] p-4">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Assignment Settings</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="opensAt">Opens at</Label>
              <Input
                id="opensAt"
                type="datetime-local"
                value={opensAtText}
                onChange={(e) => setOpensAtText(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="closesAt">Closes at</Label>
              <Input
                id="closesAt"
                type="datetime-local"
                value={closesAtText}
                onChange={(e) => setClosesAtText(e.target.value)}
              />
            </div>

            {targetKind === 'ASSESSMENT' ? (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="windowMinutes">Time limit (minutes)</Label>
                  <Input
                    id="windowMinutes"
                    inputMode="numeric"
                    value={String(windowMinutes)}
                    onChange={(e) => setWindowMinutes(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="numQuestions">Number of questions</Label>
                  <Input
                    id="numQuestions"
                    inputMode="numeric"
                    value={String(numQuestions)}
                    onChange={(e) => setNumQuestions(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="requiredSets">Required sets</Label>
                  <Input
                    id="requiredSets"
                    inputMode="numeric"
                    value={String(requiredSets)}
                    onChange={(e) => setRequiredSets(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="minimumScorePercent">Min. score to qualify (%)</Label>
                  <Input
                    id="minimumScorePercent"
                    inputMode="numeric"
                    value={String(minimumScorePercent)}
                    onChange={(e) => setMinimumScorePercent(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            )}
          </div>

          <HelpText>
            {targetKind === 'ASSESSMENT'
              ? 'Defaults match the most recent classroom test configuration.'
              : 'Students must complete the required number of sets with scores at or above the minimum before the deadline.'}
          </HelpText>
        </div>
      </div>
    </Modal>
  );
}
