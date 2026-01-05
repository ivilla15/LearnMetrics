'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AttemptLike = {
  completedAt: string;
  levelAtTime: number;
};

type Props = {
  attempts: AttemptLike[];
  height?: number;
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  // short + readable
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function LevelProgressChart({ attempts, height = 220 }: Props) {
  // Sort oldest → newest so the line moves left→right in time
  const data = [...attempts]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((a) => ({
      date: a.completedAt, // keep ISO for tooltip
      level: a.levelAtTime,
    }));

  if (data.length < 2) {
    return (
      <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
        Not enough attempts to show a chart yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-800">Level progression</div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              minTickGap={18}
              tick={{ fontSize: 12 }}
            />
            <YAxis dataKey="level" allowDecimals={false} domain={[1, 12]} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value) => [`Level ${value}`, 'Level']}
            />
            <Line type="monotone" dataKey="level" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
