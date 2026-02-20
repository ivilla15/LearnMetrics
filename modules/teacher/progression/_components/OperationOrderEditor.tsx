'use client';

import * as React from 'react';
import { Button, HelpText } from '@/components';
import type { OperationCode } from '@/types/api/progression';

function move<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function OperationOrderEditor(props: {
  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  onChange: (order: OperationCode[]) => void;
  disabled: boolean;
}) {
  const { enabledOperations, operationOrder, onChange, disabled } = props;

  const enabledSet = React.useMemo(() => new Set(enabledOperations), [enabledOperations]);

  const order = React.useMemo(() => {
    const cleaned = operationOrder.filter((op) => enabledSet.has(op));
    for (const op of enabledOperations) {
      if (!cleaned.includes(op)) cleaned.push(op);
    }
    return cleaned;
  }, [operationOrder, enabledOperations, enabledSet]);

  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Operation order</div>

      <div className="grid gap-2">
        {order.map((op, i) => (
          <div
            key={op}
            className="flex items-center justify-between rounded-(--radius) bg-[hsl(var(--surface-2))] px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-mono">{op}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled || i === 0}
                onClick={() => onChange(move(order, i, i - 1))}
              >
                Up
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled || i === order.length - 1}
                onClick={() => onChange(move(order, i, i + 1))}
              >
                Down
              </Button>
            </div>
          </div>
        ))}
      </div>

      <HelpText>This controls which operation students move to next.</HelpText>
    </div>
  );
}
