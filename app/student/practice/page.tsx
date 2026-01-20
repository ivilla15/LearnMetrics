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

type MeDTO = { id: number; name: string; username: string; level: number };
type MinutesOption = 'OFF' | '2' | '4' | '6' | '8';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseIntSafe(raw: string) {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function StudentPracticeSetupPage() {
  const router = useRouter();

  const [me, setMe] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [levelText, setLevelText] = useState('3');
  const [countText, setCountText] = useState('30');
  const [minutes, setMinutes] = useState<MinutesOption>('4');

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

      const student = (json?.student ?? json) as MeDTO;
      setMe(student);

      const defaultLevel = clamp(student.level ?? 3, 1, 12);

      // ✅ set string defaults
      setLevelText(String(defaultLevel));
      setCountText('30');
      setMinutes('4');

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const lvlRaw = parseIntSafe(levelText);
    const cntRaw = parseIntSafe(countText);

    const lvl = clamp(lvlRaw ?? me?.level ?? 3, 1, 12);
    const c = clamp(cntRaw ?? 30, 6, 40);
    const m = minutes === 'OFF' ? 0 : Number(minutes);

    return { lvl, c, m };
  }, [levelText, countText, minutes, me?.level]);

  const canStart = !loading && !!me;
  const qs = new URLSearchParams({
    level: String(summary.lvl),
    count: String(summary.c),
    minutes: String(summary.m),
  });

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
                      onChange={(e) => {
                        // ✅ allow clearing and partial edits
                        const raw = e.target.value;
                        if (raw === '' || /^\d+$/.test(raw)) setLevelText(raw);
                      }}
                      onBlur={() => {
                        // ✅ normalize on blur
                        const n = parseIntSafe(levelText);
                        setLevelText(String(clamp(n ?? me.level ?? 3, 1, 12)));
                      }}
                    />
                    <HelpText>Default is your current level: {me.level}.</HelpText>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="count">Questions</Label>
                    <Input
                      id="count"
                      inputMode="numeric"
                      value={countText}
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
                      className="h-11 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
                    >
                      <option value="OFF">Off</option>
                      <option value="2">2 minutes</option>
                      <option value="4">4 minutes (recommended)</option>
                      <option value="6">6 minutes</option>
                      <option value="8">8 minutes</option>
                    </select>
                    <HelpText>Practice can be timed or untimed.</HelpText>
                  </div>

                  <Button
                    size="lg"
                    disabled={!canStart}
                    onClick={() => {
                      router.push(`/student/practice/session?${qs.toString()}`);
                    }}
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
              <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Level</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">{summary.lvl}</div>
              </div>

              <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Questions</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">{summary.c}</div>
              </div>

              <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Time</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {summary.m === 0 ? 'Off' : `${summary.m} minutes`}
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
