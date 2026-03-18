'use client';

import * as React from 'react';
import { Input, Label, HelpText } from '@/components';

export function ProgressionBasicsForm(props: {
  maxNumber: number;
  onChangeMaxNumber: (v: number) => void;
  disabled: boolean;
}) {
  const { maxNumber, onChangeMaxNumber, disabled } = props;

  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Level range</div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="maxNumber">Max level</Label>
          <Input
            id="maxNumber"
            inputMode="numeric"
            value={String(maxNumber)}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChangeMaxNumber(Number.isFinite(n) ? n : 12);
            }}
            disabled={disabled}
          />
          <HelpText>Sets the maximum level for each operation.</HelpText>
        </div>
      </div>
    </div>
  );
}
