'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TooltipContentProps = {
  active?: boolean;
  payload?: Array<{ payload?: unknown }>;
};

type AttemptLike = {
  completedAt: string;
  levelAtTime: number;
  wasMastery?: boolean;
};

type Props = {
  attempts: AttemptLike[];
  height?: number;
};

function formatDateTick(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type ChartPoint = {
  x: number;
  level: number;
  note: string;
  kind: 'START' | 'ATTEMPT';
  timestamp: number;
  labelDateMs: number;
};

function TooltipContent({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const p = payload[0]?.payload;
  if (!p || typeof p !== 'object') return null;

  if (!('timestamp' in p) || !('level' in p) || !('note' in p)) return null;

  const point = p as ChartPoint;

  return (
    <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 py-2">
      <div className="text-xs text-[hsl(var(--muted-fg))]">
        {formatTooltipDate(point.timestamp)}
      </div>
      <div className="mt-1 text-sm font-semibold text-[hsl(var(--fg))]">Level {point.level}</div>
      <div className="mt-0.5 text-xs text-[hsl(var(--muted-fg))]">{point.note}</div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeYAxisDomain(levels: number[], opts?: { pad?: number; minSpan?: number }) {
  const pad = opts?.pad ?? 1;
  const minSpan = opts?.minSpan ?? 4;

  if (!levels.length) return [0, 12] as const;

  const minL = Math.min(...levels);
  const maxL = Math.max(...levels);

  let lo = clamp(minL - pad, 0, 12);
  let hi = clamp(maxL + pad, 0, 12);

  const span = hi - lo;
  if (span < minSpan) {
    const need = minSpan - span;

    const expandDown = Math.min(Math.floor(need / 2), lo);
    lo -= expandDown;

    const expandUp = Math.min(need - expandDown, 12 - hi);
    hi += expandUp;

    const remaining = minSpan - (hi - lo);
    if (remaining > 0) {
      if (lo > 0) lo = clamp(lo - remaining, 0, 12);
      else hi = clamp(hi + remaining, 0, 12);
    }
  }

  return [lo, hi] as const;
}

export function LevelProgressChart({ attempts, height = 260 }: Props) {
  const sorted = React.useMemo(() => {
    return [...attempts].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    );
  }, [attempts]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 text-sm text-[hsl(var(--muted-fg))]">
        No attempts yet. Complete a test to see your level progression.
      </div>
    );
  }

  const startLevel = clamp(sorted[0].levelAtTime ?? 1, 1, 12);

  const firstAttemptMs = new Date(sorted[0].completedAt).getTime();

  const data: ChartPoint[] = [
    {
      x: 0,
      level: startLevel,
      timestamp: firstAttemptMs,
      labelDateMs: firstAttemptMs,
      note: 'Starting level',
      kind: 'START',
    },
    ...sorted.map((a, i): ChartPoint => {
      const mastery = a.wasMastery === true;

      const levelAfter = mastery ? a.levelAtTime + 1 : a.levelAtTime;
      const finalLevel = clamp(levelAfter, 1, 12);

      const ts = new Date(a.completedAt).getTime();

      return {
        x: i + 1,
        level: finalLevel,
        timestamp: ts,
        labelDateMs: ts,
        note: mastery ? 'Increased due to mastery' : 'Stayed the same (not mastered)',
        kind: 'ATTEMPT',
      };
    }),
  ];

  const levels = data.map((d) => d.level);
  const yDomain = computeYAxisDomain(levels, { pad: 1, minSpan: 4 });

  const lastX = data.length - 1;
  const PAD_X = 0.35;
  const xDomain: [number, number] = [-PAD_X, lastX + PAD_X];

  const desiredTicks = Math.min(6, data.length);
  const step = Math.max(1, Math.ceil((data.length - 1) / (desiredTicks - 1 || 1)));

  const xTicks = Array.from({ length: data.length }, (_, i) => i).filter((i) => i % step === 0);
  if (xTicks[xTicks.length - 1] !== lastX) xTicks.push(lastX);

  return (
    <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
      <div className="mb-2 text-sm font-semibold text-[hsl(var(--fg))]">Level progression</div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />

            <XAxis
              dataKey="x"
              type="number"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={(xVal) => {
                const idx = Number(xVal);
                const p = data[idx];
                return p ? formatDateTick(p.labelDateMs) : '';
              }}
              tick={{ fontSize: 12 }}
              minTickGap={20}
            />

            <YAxis
              dataKey="level"
              allowDecimals={false}
              domain={yDomain}
              ticks={Array.from(
                { length: yDomain[1] - yDomain[0] + 1 },
                (_, i) => yDomain[0] + i,
              ).filter((t) => t !== 0)} // 👈 hide 0 label
              tick={{ fontSize: 12 }}
            />

            <Tooltip content={<TooltipContent />} />

            <Line
              type="linear"
              dataKey="level"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
        Each point shows your <span className="font-medium">level after the test</span>. Spacing
        between points is equal (by attempt), not by time.
      </div>
    </div>
  );
}
