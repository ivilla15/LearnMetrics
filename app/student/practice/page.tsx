'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppPage, PracticeSetupSkeleton } from '@/modules';
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
  Section,
} from '@/components';

import type { StudentMeDTO, MinutesOption } from '@/types';
import { parseIntSafe, clamp } from '@/utils';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import { DOMAIN_CONFIG, getDomainLabel } from '@/core/domain';

function maxQuestionsForDomain(domain: DomainCode): number {
  return DOMAIN_CONFIG[domain].progressionStyle === 'FACT_FAMILY' ? 13 : 200;
}

export default function StudentPracticeSetupPage() {
  const router = useRouter();

  const [me, setMe] = useState<StudentMeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [levelText, setLevelText] = useState('3');
  const [countText, setCountText] = useState('30');
  const [minutes, setMinutes] = useState<MinutesOption>('4');

  const [selectedDomain, setSelectedDomain] = useState<DomainCode>('MUL_WHOLE');
  const [enabledDomains, setEnabledDomains] = useState<DomainCode[]>([]);
  const [practiceMaxNumber, setPracticeMaxNumber] = useState<number>(12);

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

      const cfgRes = await fetch('/api/student/practice');
      const cfg = await cfgRes.json().catch(() => null);

      if (cfgRes.ok && cfg) {
        if (typeof cfg.practiceMaxNumber === 'number') {
          setPracticeMaxNumber(clamp(cfg.practiceMaxNumber, 1, 100));
        }
        if (Array.isArray(cfg.enabledDomains) && cfg.enabledDomains.length > 0) {
          setEnabledDomains(cfg.enabledDomains as DomainCode[]);
          const first = cfg.enabledDomains[0] as DomainCode;
          setSelectedDomain(first);
        } else {
          setEnabledDomains([...DOMAIN_CODES]);
        }
      } else {
        setPracticeMaxNumber(12);
        setEnabledDomains([...DOMAIN_CODES]);
      }

      const student = (json?.student ?? json) as StudentMeDTO;
      setMe(student);

      const defaultLevel = clamp(student.progress?.level ?? 3, 1, 12);
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

    const lvl = clamp(lvlRaw ?? 3, 1, 12);
    const maxAvail = maxQuestionsForDomain(selectedDomain);
    const c = clamp(cntRaw ?? 30, 6, Math.min(40, maxAvail));
    const m = minutes === 'OFF' ? 0 : Number(minutes);

    return { lvl, c, m, domain: selectedDomain };
  }, [levelText, countText, minutes, selectedDomain]);

  const qsString = useMemo(() => {
    const p = new URLSearchParams({
      domain: summary.domain,
      level: String(summary.lvl),
      count: String(summary.c),
      minutes: String(summary.m),
      maxNumber: String(practiceMaxNumber),
    });
    return p.toString();
  }, [summary, practiceMaxNumber]);

  const maxAvailable = useMemo(
    () => maxQuestionsForDomain(summary.domain),
    [summary.domain],
  );

  const domainsToShow = enabledDomains.length > 0 ? enabledDomains : [...DOMAIN_CODES];

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
                <PracticeSetupSkeleton />
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
                        setLevelText(String(clamp(n ?? 3, 1, 12)));
                      }}
                    />
                    <HelpText>
                      Default is your current level: {me.progress?.level ?? 3}.
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
                        setCountText(String(clamp(n ?? 30, 6, Math.min(40, maxAvailable))));
                      }}
                    />
                    <HelpText>
                      Recommended: 20–30 questions. Max {Math.min(40, maxAvailable)} for this
                      domain.
                    </HelpText>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="minutes">Time limit</Label>
                    <select
                      id="minutes"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value as MinutesOption)}
                      className="h-11 rounded-(--radius) border-0 bg-[hsl(var(--surface))] px-3 text-sm shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
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
                    <Label>Domain</Label>
                    <div className="flex flex-wrap gap-2">
                      {domainsToShow.map((d) => {
                        const active = selectedDomain === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDomain(d)}
                            className={[
                              'rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                              active
                                ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                            ].join(' ')}
                          >
                            {getDomainLabel(d)}
                          </button>
                        );
                      })}
                    </div>
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
              <CardDescription>What you&apos;re about to start</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-4">
                <div className="text-xs text-[hsl(var(--muted-fg))]">Domain</div>
                <div className="text-lg font-semibold text-[hsl(var(--fg))]">
                  {getDomainLabel(summary.domain)}
                </div>
              </div>

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

              <HelpText>
                Practice is meant to help you build speed and accuracy. Your teacher won&apos;t see
                these results.
              </HelpText>
            </CardContent>
          </Card>
        </div>
      </Section>
    </AppPage>
  );
}
