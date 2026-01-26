'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Modal, Button, Input, Label, HelpText, Badge, useToast } from '@/components';

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

  lastTestMeta: LastTestMeta | null;

  onCreated?: () => void;
  defaultAudience?: AudienceMode;
  defaultSelectedIds?: number[];
};

type AudienceMode = 'MISSED_LAST' | 'ALL' | 'CUSTOM';

function toDatetimeLocalValue(d: Date) {
  // YYYY-MM-DDTHH:mm
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
    const closesAt = fromDatetimeLocalValue(closesAtText);

    if (!opensAt || !closesAt) {
      setError('Please enter valid open/close dates.');
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
    if (selectedCount < 1) {
      setError('Select at least one student.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          opensAt: opensAt.toISOString(),
          closesAt: closesAt.toISOString(),
          windowMinutes,
          numQuestions,
          studentIds: computedStudentIds,
          ...(questionSetId ? { questionSetId } : {}),
        }),
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
      title="Assign makeup test"
      description="Create a manual assignment for selected students."
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
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[14px] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm text-[hsl(var(--danger))]">
            {error}
          </div>
        ) : null}

        {/* Audience */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Who gets this test?</div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAudience('MISSED_LAST')}
              className={[
                'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                audience === 'MISSED_LAST'
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              Missed last test ({missedLastStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setAudience('ALL')}
              className={[
                'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                audience === 'ALL'
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              All eligible ({eligibleStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setAudience('CUSTOM')}
              className={[
                'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                audience === 'CUSTOM'
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              Custom
            </button>
          </div>

          <HelpText>
            Students who <span className="font-medium">need setup</span> are excluded automatically.
          </HelpText>

          {audience === 'CUSTOM' ? (
            <div className="space-y-3 pt-2">
              <div className="grid gap-1">
                <Label htmlFor="assign-search">Search students</Label>
                <Input
                  id="assign-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or username…"
                />
              </div>

              <div className="max-h-80 overflow-auto rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                {filteredEligible.length === 0 ? (
                  <div className="p-4 text-sm text-[hsl(var(--muted-fg))]">No matches.</div>
                ) : (
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {filteredEligible.map((s) => {
                      const checked = selectedIds.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-[hsl(var(--surface-2))]"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(var(--fg))] truncate">
                              {s.name}
                            </div>
                            <div className="text-xs font-mono text-[hsl(var(--muted-fg))] truncate">
                              {s.username}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {s.flags?.missedLastTest
                                ? Badge('Missed last test', 'warning')
                                : null}
                            </div>
                          </div>

                          <input
                            type="checkbox"
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
          ) : null}
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">Settings</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="opensAt">Opens at</Label>
              <Input
                id="opensAt"
                type="datetime-local"
                value={opensAtText}
                onChange={(e) => setOpensAtText(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="closesAt">Closes at</Label>
              <Input
                id="closesAt"
                type="datetime-local"
                value={closesAtText}
                onChange={(e) => setClosesAtText(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="windowMinutes">Time limit (minutes)</Label>
              <Input
                id="windowMinutes"
                inputMode="numeric"
                value={String(windowMinutes)}
                onChange={(e) => setWindowMinutes(Number(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="numQuestions">Questions</Label>
              <Input
                id="numQuestions"
                inputMode="numeric"
                value={String(numQuestions)}
                onChange={(e) => setNumQuestions(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <HelpText>
            Defaults match the most recent test when available. This uses the existing manual
            assignment API.
          </HelpText>
        </div>
      </div>
    </Modal>
  );
}
