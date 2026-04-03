'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { OperationCode } from '@/types';
import { OPERATION_SYMBOL } from '@/types';

export type AttemptRowForChart = {
  attemptId: number;
  completedAt: string;
  operation: OperationCode;
  levelAtTime: number;
  wasMastery: boolean;
  percent: number;
};

const OP_COLOR: Record<OperationCode, string> = {
  ADD: 'hsl(var(--brand))',
  SUB: 'hsl(var(--danger))',
  MUL: 'hsl(var(--success))',
  DIV: 'hsl(var(--warning))',
};

type ChartPoint = {
  x: number; // timestamp ms
  level: number;
  wasMastery: boolean;
  percent: number;
  perseveranceLabel?: string;
  operation: OperationCode;
  formattedDate: string;
};

function formatDateTick(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildOpData(
  attempts: AttemptRowForChart[],
  operation: OperationCode,
): ChartPoint[] {
  const opAttempts = [...attempts]
    .filter((a) => a.operation === operation)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  if (opAttempts.length === 0) return [];

  // Detect perseverance: 2+ consecutive non-mastery before a mastery
  const perseveranceMap = new Map<number, string>();
  let streak = 0;
  for (let i = 0; i < opAttempts.length; i++) {
    if (!opAttempts[i].wasMastery) {
      streak++;
    } else {
      if (streak >= 2) {
        perseveranceMap.set(i, `Took ${streak + 1} attempts`);
      }
      streak = 0;
    }
  }

  return opAttempts.map((a, i) => {
    const ts = new Date(a.completedAt).getTime();
    const levelAfter = a.wasMastery ? Math.min(a.levelAtTime + 1, 12) : a.levelAtTime;
    return {
      x: ts,
      level: levelAfter,
      wasMastery: a.wasMastery,
      percent: a.percent,
      operation,
      perseveranceLabel: perseveranceMap.get(i),
      formattedDate: formatTooltipDate(ts),
    };
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function computeYDomain(allLevels: number[]) {
  if (!allLevels.length) return [0, 12] as [number, number];
  const lo = clamp(Math.min(...allLevels) - 1, 0, 12);
  const hi = clamp(Math.max(...allLevels) + 1, 0, 12);
  const span = hi - lo;
  if (span < 4) return [Math.max(0, lo - 1), Math.min(12, hi + 1)] as [number, number];
  return [lo, hi] as [number, number];
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: unknown; color?: string; name?: string }>;
  label?: number;
};

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[12px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 py-2 space-y-1.5">
      {payload.map((entry, i) => {
        const p = entry.payload;
        if (!p || typeof p !== 'object') return null;
        const point = p as ChartPoint;
        return (
          <div key={i}>
            <div className="text-xs text-[hsl(var(--muted-fg))]">{point.formattedDate}</div>
            <div className="text-sm font-semibold" style={{ color: entry.color }}>
              {point.operation} {OPERATION_SYMBOL[point.operation]} — Level {point.level}
            </div>
            <div className="text-xs text-[hsl(var(--muted-fg))]">
              {point.percent}% • {point.wasMastery ? '✓ Mastered' : '✗ Not mastered'}
            </div>
            {point.perseveranceLabel ? (
              <div className="text-xs text-[hsl(var(--brand))] font-medium">
                {point.perseveranceLabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  stroke?: string;
};

function MasteryDot({ cx, cy, payload, stroke }: DotProps) {
  if (cx == null || cy == null || !payload) return null;
  const fill = payload.wasMastery ? 'hsl(var(--success))' : 'hsl(var(--danger))';
  const r = payload.perseveranceLabel ? 7 : 4;
  return (
    <g key={`dot-${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
    </g>
  );
}

type Props = {
  attempts: AttemptRowForChart[];
  currentLevel?: number;
  height?: number;
};

export function MultiOpLevelProgressChart({ attempts, currentLevel, height = 280 }: Props) {
  const activeOperations = React.useMemo(
    () =>
      ((['ADD', 'SUB', 'MUL', 'DIV'] as OperationCode[]).filter((op) =>
        attempts.some((a) => a.operation === op),
      )),
    [attempts],
  );

  const opData = React.useMemo(
    () =>
      Object.fromEntries(
        activeOperations.map((op) => [op, buildOpData(attempts, op)]),
      ) as Record<OperationCode, ChartPoint[]>,
    [attempts, activeOperations],
  );

  const allLevels = React.useMemo(
    () => activeOperations.flatMap((op) => opData[op].map((p) => p.level)),
    [activeOperations, opData],
  );

  const yDomain = computeYDomain(allLevels);

  const allTimestamps = React.useMemo(
    () => activeOperations.flatMap((op) => opData[op].map((p) => p.x)),
    [activeOperations, opData],
  );

  if (allTimestamps.length === 0) {
    return (
      <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4 text-sm text-[hsl(var(--muted-fg))]">
        No attempts yet. Complete a test to see level progression.
      </div>
    );
  }

  const yTicks = Array.from(
    { length: yDomain[1] - yDomain[0] + 1 },
    (_, i) => yDomain[0] + i,
  ).filter((t) => t > 0);

  return (
    <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
      <div className="mb-2 text-sm font-semibold text-[hsl(var(--fg))]">Level progression</div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />

            <XAxis
              type="number"
              dataKey="x"
              scale="time"
              domain={['auto', 'auto']}
              tickFormatter={formatDateTick}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />

            <YAxis
              type="number"
              dataKey="level"
              domain={yDomain}
              ticks={yTicks}
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              formatter={(value) => {
                const op = value as OperationCode;
                return `${op} ${OPERATION_SYMBOL[op] ?? ''}`;
              }}
            />

            {currentLevel != null ? (
              <ReferenceLine
                y={currentLevel}
                yAxisId={0}
                stroke="hsl(var(--muted-fg))"
                strokeDasharray="6 3"
                label={{
                  value: `Current Lvl ${currentLevel}`,
                  position: 'right',
                  fontSize: 11,
                  fill: 'hsl(var(--muted-fg))',
                }}
              />
            ) : null}

            {activeOperations.map((op) => (
              <Line
                key={op}
                data={opData[op]}
                dataKey="level"
                name={op}
                type="linear"
                stroke={OP_COLOR[op]}
                strokeWidth={2}
                dot={(dotProps) => (
                  <MasteryDot
                    key={`dot-${dotProps.cx}-${dotProps.cy}-${op}`}
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    payload={dotProps.payload as ChartPoint}
                    stroke={OP_COLOR[op]}
                  />
                )}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
        Green dots = mastered, red dots = not mastered. Larger dot = perseverance moment.
      </div>
    </div>
  );
}
