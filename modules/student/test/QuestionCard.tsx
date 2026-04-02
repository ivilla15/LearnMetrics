'use client';

import * as React from 'react';

import { Card, CardContent, Input } from '@/components';
import { cn } from '@/lib';
import type { OperationCode } from '@/types/enums';
import type { OperandValue } from '@/types';
import { formatOperand, opSymbol } from '@/types';

type AnswerMode = 'DECIMAL' | 'FRACTION' | null;

type Props = {
  index: number;
  operation: OperationCode;
  operandA: OperandValue;
  operandB: OperandValue;
  value: string;
  answerMode: AnswerMode;
  isAnswered: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onChange: (next: string) => void;
  onEnter?: () => void;
};

export function QuestionCard({
  index,
  operation,
  operandA,
  operandB,
  value,
  answerMode,
  isAnswered,
  inputRef,
  onChange,
  onEnter,
}: Props) {
  const placeholder = answerMode === 'FRACTION' ? 'Answer (e.g. 3/4 or 2)' : 'Answer';

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
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

        <div className="rounded-(--radius) bg-[hsl(var(--surface-2))] px-4 py-4">
          <div className="text-2xl font-semibold tracking-tight text-[hsl(var(--fg))]">
            {formatOperand(operandA)} {opSymbol(operation)} {formatOperand(operandB)}
          </div>
        </div>

        <Input
          ref={inputRef}
          inputMode={answerMode === 'FRACTION' ? 'text' : 'decimal'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            onEnter?.();
          }}
          className="h-11 text-base"
        />

        <div className="text-xs text-[hsl(var(--muted-fg))]">
          {answerMode === 'FRACTION'
            ? 'Use a fraction like 3/4 or a whole number like 2. Press Enter to go next.'
            : 'Press Enter to go next.'}
        </div>
      </CardContent>
    </Card>
  );
}
