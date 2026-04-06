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
import type { OperationCode } from '@/types';

const OP_CONFIG: Record<OperationCode, { label: string; symbol: string; color: string }> = {
  ADD: { label: 'Addition', symbol: '+', color: 'hsl(var(--brand))' },
  SUB: { label: 'Subtraction', symbol: '−', color: 'hsl(var(--danger))' },
  MUL: { label: 'Multiplication', symbol: '×', color: 'hsl(var(--success))' },
  DIV: { label: 'Division', symbol: '÷', color: 'hsl(var(--warning))' },
};

const ALL_OPS: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];

type ActiveStudent = { activeOperation: OperationCode };

type ChartRow = { operation: OperationCode; count: number; label: string; color: string; fullLabel: string };

export function OperationDistributionCard({
  students,
  loading,
}: {
  students: ActiveStudent[];
  loading?: boolean;
}) {
  const chartData: ChartRow[] = React.useMemo(() => {
    const map = new Map<OperationCode, number>();
    for (const s of students) map.set(s.activeOperation, (map.get(s.activeOperation) ?? 0) + 1);
    return ALL_OPS.map((op) => ({
      operation: op,
      count: map.get(op) ?? 0,
      label: `${OP_CONFIG[op].symbol} ${op}`,
      color: OP_CONFIG[op].color,
      fullLabel: OP_CONFIG[op].label,
    }));
  }, [students]);

  const hasData = students.length > 0;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Operation Distribution</CardTitle>
        <CardDescription>Students by their current active operation in progression.</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-[14px]" />
        ) : !hasData ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No students yet.</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
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
                    <Cell key={d.operation} fill={d.color} />
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
