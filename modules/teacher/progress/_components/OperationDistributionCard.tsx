'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';
import { getDomainLabel, opModifierToDomain } from '@/core/domain';
import type { DomainCode } from '@/types/domain';
import type { OperationCode } from '@/types';

// One color per base operation so whole/fraction/decimal variants share a palette.
const OP_COLORS: Record<string, string> = {
  ADD: 'hsl(var(--brand))',
  SUB: 'hsl(var(--danger))',
  MUL: 'hsl(var(--success))',
  DIV: 'hsl(var(--warning))',
};

function colorForDomain(domain: DomainCode): string {
  const op = domain.split('_')[0] ?? 'MUL';
  return OP_COLORS[op] ?? 'hsl(var(--muted-fg))';
}

type ActiveStudent = {
  activeDomain?: string | null;
  activeOperation: OperationCode;
};

type ChartRow = {
  domain: DomainCode;
  count: number;
  label: string;
  color: string;
  fullLabel: string;
};

export function OperationDistributionCard({
  students,
  loading,
}: {
  students: ActiveStudent[];
  loading?: boolean;
}) {
  const chartData: ChartRow[] = React.useMemo(() => {
    const map = new Map<DomainCode, number>();

    for (const s of students) {
      // Prefer explicit domain; fall back to deriving _WHOLE from activeOperation.
      const domain: DomainCode =
        s.activeDomain && s.activeDomain.length > 0
          ? (s.activeDomain as DomainCode)
          : opModifierToDomain(s.activeOperation, null);

      map.set(domain, (map.get(domain) ?? 0) + 1);
    }

    // Only emit rows that have at least one student, in their natural map order.
    return Array.from(map.entries()).map(([domain, count]) => ({
      domain,
      count,
      label: getDomainLabel(domain),
      color: colorForDomain(domain),
      fullLabel: getDomainLabel(domain),
    }));
  }, [students]);

  const hasData = students.length > 0;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Domain Distribution</CardTitle>
        <CardDescription>Students by their current active domain in progression.</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : !hasData ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--surface-2))' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                    background: 'hsl(var(--surface))',
                    fontSize: 13,
                  }}
                  formatter={(value, _name, entry) => [
                    `${value as number} student${(value as number) === 1 ? '' : 's'}`,
                    (entry.payload as ChartRow).fullLabel,
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.domain} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
