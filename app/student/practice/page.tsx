'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppPage } from '@/modules';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Label,
  HelpText,
  Input,
  Skeleton,
  Section,
} from '@/components';

import type { StudentMeDTO, MinutesOption } from '@/types';
import { parseIntSafe, clamp } from '@/utils';
import { OPERATION_CODES, type OperationCode } from '@/types/enums';

type OpCode = OperationCode;
const OPS = OPERATION_CODES;

function getLevelForOp(progress: StudentMeDTO['progress'], op: OpCode): number | null {
  const list = Array.isArray(progress) ? progress : [];
  const row = list.find((p) => p.operation === op);
  return typeof row?.level === 'number' ? row.level : null;
}

export default function StudentPracticeSetupPage() {
  const router = useRouter();

  const [me, setMe] = useState<StudentMeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [levelText, setLevelText] = useState('3');
  const [countText, setCountText] = useState('30');
  const [minutes, setMinutes] = useState<MinutesOption>('4');

  const [selectedOps, setSelectedOps] = useState<OpCode[]>(['MUL']);
  const [fractions, setFractions] = useState(false);
  const [decimals, setDecimals] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const res = await fetch('/api/student/me');
      const json = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok || !json) {
        setMe(null);
        setLoading(false);
        return;
      }

      const student = (json?.student ?? json) as StudentMeDTO;
      setMe(student);

      const defaultLevel = clamp(getLevelForOp(student.progress, 'MUL') ?? 3, 1, 12);
      setLevelText(String(defaultLevel));
      setCountText('30');
      setMinutes('4');

      setSelectedOps(['MUL']);
      setFractions(false);
      setDecimals(false);

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleOp = (op: OpCode) => {
    setSelectedOps((prev) => {
      const next = new Set(prev);
      if (next.has(op)) next.delete(op);
      else next.add(op);
      return Array.from(next) as OpCode[];
    });
  };

  const selectAllOps = () => {
    setSelectedOps(Array.from(OPS) as OpCode[]);
  };

  const clearOps = () => {
    setSelectedOps([]);
  };

  const summary = useMemo(() => {
    const lvlRaw = parseIntSafe(levelText);
    const cntRaw = parseIntSafe(countText);

    const lvl = clamp(lvlRaw ?? (me ? getLevelForOp(me.progress, 'MUL') : null) ?? 3, 1, 12);
    const c = clamp(cntRaw ?? 30, 6, 40);
    const m = minutes === 'OFF' ? 0 : Number(minutes);

    const ops = selectedOps.length > 0 ? selectedOps : (['MUL'] as OpCode[]);

    return { lvl, c, m, ops, fractions, decimals };
  }, [levelText, countText, minutes, me, selectedOps, fractions, decimals]);

  const qsString = useMemo(() => {
    const params = new URLSearchParams({
      level: String(summary.lvl),
      count: String(summary.c),
      minutes: String(summary.m),
      ops: summary.ops.join(','),
      fractions: summary.fractions ? '1' : '0',
      decimals: summary.decimals ? '1' : '0',
    });
    return params.toString();
  }, [summary.lvl, summary.c, summary.m, summary.ops, summary.fractions, summary.decimals]);

  const canStart = !loading && !!me;

  return (
    <AppPage
      title="Practice"
      subtitle="Pick a level and warm up with a short timed set."
      width="wide"
    >
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Build a practice set</CardTitle>
              <CardDescription>
                Nothing is saved. You can practice as many times as you want.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ) : !me ? (
                <div className="text-sm text-[hsl(var(--muted-fg))]">Not signed in.</div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      inputMode="numeric"
                      value={levelText}
                      className="shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '' || /^\d+$/.test(raw)) setLevelText(raw);
                      }}
                      onBlur={() => {
                        const n = parseIntSafe(levelText);
                        setLevelText(
                          String(
                            clamp(n ?? (me ? getLevelForOp(me.progress, 'MUL') : null) ?? 3, 1, 12),
                          ),
                        );
                      }}
                    />
                    <HelpText>
                      Default is your current level: {getLevelForOp(me.progress, 'MUL') ?? 3}.
                    </HelpText>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="count">Questions</Label>
                    <Input
                      id="count"
                      inputMode="numeric"
                      value={countText}
                      className="shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '' || /^\d+$/.test(raw)) setCountText(raw);
                      }}
                      onBlur={() => {
                        const n = parseIntSafe(countText);
                        setCountText(String(clamp(n ?? 30, 6, 40)));
                      }}
                    />
                    <HelpText>Recommended: 20–30 questions. Max 40.</HelpText>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="minutes">Time limit</Label>
                    <select
                      id="minutes"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value as MinutesOption)}
                      className="h-11 rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm"
                    >
                      <option value="OFF">Off</option>
                      <option value="2">2 minutes</option>
                      <option value="4">4 minutes (recommended)</option>
                      <option value="6">6 minutes</option>
                      <option value="8">8 minutes</option>
                    </select>
                    <HelpText>Practice can be timed or untimed.</HelpText>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Operations</Label>
                      <div className="flex gap-2">
                        <button type="button" onClick={selectAllOps} className="text-xs underline">
                          All
                        </button>
                        <button type="button" onClick={clearOps} className="text-xs underline">
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {OPS.map((op) => {
                        const active = selectedOps.includes(op);
                        return (
                          <button
                            key={op}
                            type="button"
                            onClick={() => toggleOp(op)}
                            className={[
                              'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                              active
                                ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                            ].join(' ')}
                          >
                            {op === 'ADD'
                              ? 'Add'
                              : op === 'SUB'
                                ? 'Sub'
                                : op === 'MUL'
                                  ? 'Mul'
                                  : 'Div'}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 flex gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={fractions}
                          onChange={(e) => setFractions(e.target.checked)}
                        />
                        <span className="text-sm">Include fractions</span>
                      </label>

                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={decimals}
                          onChange={(e) => setDecimals(e.target.checked)}
                        />
                        <span className="text-sm">Include decimals</span>
                      </label>
                    </div>

                    <HelpText>
                      By default practice focuses on multiplication. Choose other operations or
                      include fractions/decimals for mixed practice.
                    </HelpText>
                  </div>

                  <Button
                    size="lg"
                    disabled={!canStart}
                    onClick={() => router.push(`/student/practice/session?${qsString}`)}
                  >
                    Start practice
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>What you’re about to start</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Level</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">{summary.lvl}</div>
              </div>

              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Questions</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">{summary.c}</div>
              </div>

              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Time</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {summary.m === 0 ? 'Off' : `${summary.m} minutes`}
                </div>
              </div>

              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Operations</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {summary.ops.join(', ')}
                </div>
              </div>

              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Extras</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {summary.fractions ? 'Fractions' : 'No fractions'} ·{' '}
                  {summary.decimals ? 'Decimals' : 'No decimals'}
                </div>
              </div>

              <HelpText>
                Practice is meant to help you build speed and accuracy. Your teacher won’t see these
                results.
              </HelpText>
            </CardContent>
          </Card>
        </div>
      </Section>
    </AppPage>
  );
}
