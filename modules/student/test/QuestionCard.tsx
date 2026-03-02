'use client';

import * as React from 'react';
import { Card, CardContent, Input } from '@/components';
import { cn } from '@/lib';
import type { OperationCode } from '@/types/enums';
import { OPERATION_SYMBOL } from '@/types/ui/operations';

type Props = {
  index: number;
  operation: OperationCode;
  operandA: number;
  operandB: number;
  value: number | '';
  isAnswered: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onChange: (next: number | '') => void;
  onEnter?: () => void;
};

export function QuestionCard({
  index,
  operation,
  operandA,
  operandB,
  value,
  isAnswered,
  inputRef,
  onChange,
  onEnter,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[hsl(var(--fg))]">#{index + 1}</div>

          <div
            className={cn(
              'text-xs font-medium',
              isAnswered ? 'text-[hsl(var(--fg))]' : 'text-[hsl(var(--muted-fg))]',
            )}
          >
            {isAnswered ? 'Answered' : 'Unanswered'}
          </div>
        </div>

        <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] px-4 py-4">
          <div className="text-2xl font-semibold tracking-tight text-[hsl(var(--fg))]">
            {operandA} {OPERATION_SYMBOL[operation]} {operandB}
          </div>
        </div>

        <Input
          ref={inputRef}
          inputMode="numeric"
          placeholder="Answer"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') return onChange('');
            if (!/^\d+$/.test(v)) return;
            onChange(Number(v));
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            onEnter?.();
          }}
          className="h-11 text-base"
        />

        <div className="text-xs text-[hsl(var(--muted-fg))]">Press Enter to go next.</div>
      </CardContent>
    </Card>
  );
}
