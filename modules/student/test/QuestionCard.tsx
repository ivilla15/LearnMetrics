'use client';

import * as React from 'react';
import { Card, CardContent, Input } from '@/components';
import { cn } from '@/lib';

type Props = {
  index: number;
  factorA: number;
  factorB: number;
  value: number | '';
  isAnswered: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onChange: (next: number | '') => void;
  onEnter?: () => void;
};

export function QuestionCard({
  index,
  factorA,
  factorB,
  value,
  isAnswered,
  inputRef,
  onChange,
  onEnter,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Top row */}
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

        {/* Prompt */}
        <div className="rounded-[var(--radius)] bg-[hsl(var(--surface-2))] px-4 py-4">
          <div className="text-2xl font-semibold tracking-tight text-[hsl(var(--fg))]">
            {factorA} × {factorB}
          </div>
        </div>

        {/* Input */}
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
