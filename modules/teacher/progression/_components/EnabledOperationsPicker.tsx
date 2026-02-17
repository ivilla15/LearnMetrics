'use client';

import * as React from 'react';
import { HelpText } from '@/components';
import { ALL_OPS } from '@/types/progression';
import type { OperationCode } from '@/types/progression';

export function EnabledOperationsPicker(props: {
  enabledOperations: OperationCode[];
  onChange: (ops: OperationCode[]) => void;
  disabled: boolean;
}) {
  const { enabledOperations, onChange, disabled } = props;

  const enabledSet = React.useMemo(() => new Set(enabledOperations), [enabledOperations]);

  function toggle(op: OperationCode) {
    const next = new Set(enabledSet);
    if (next.has(op)) next.delete(op);
    else next.add(op);

    const arr = ALL_OPS.filter((x) => next.has(x));
    onChange(arr.length ? arr : ['MUL']);
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Enabled operations</div>

      <div className="flex flex-wrap gap-3">
        {ALL_OPS.map((op) => {
          const checked = enabledSet.has(op);
          return (
            <label key={op} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(op)}
                disabled={disabled}
                aria-label={`Enable ${op}`}
              />
              <span className="font-mono">{op}</span>
            </label>
          );
        })}
      </div>

      <HelpText>Students progress through enabled operations in the order below.</HelpText>
    </div>
  );
}
