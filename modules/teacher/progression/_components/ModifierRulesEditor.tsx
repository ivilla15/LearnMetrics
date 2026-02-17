'use client';

import * as React from 'react';
import { HelpText, Input, Button } from '@/components';
import {
  modifierSchema,
  type ModifierCode,
  type ModifierRule,
  type OperationCode,
} from '@/types/progression';
import { clamp } from '@/utils';

const MODIFIERS: ModifierCode[] = [modifierSchema.enum.DECIMAL, modifierSchema.enum.FRACTION];

function ensureRule(mod: ModifierCode, rules: ModifierRule[]): ModifierRule {
  const existing = rules.find((r) => r.modifier === mod);
  return (
    existing ?? {
      modifier: mod,
      operations: [],
      minLevel: 1,
      propagate: false,
      enabled: false,
    }
  );
}

export function ModifierRulesEditor(props: {
  enabledOperations: OperationCode[];
  maxNumber: number;
  rules: ModifierRule[];
  onChange: (rules: ModifierRule[]) => void;
  disabled: boolean;
}) {
  const { enabledOperations, maxNumber, rules, onChange, disabled } = props;

  const enabledSet = React.useMemo(() => new Set(enabledOperations), [enabledOperations]);

  const normalized = React.useMemo(() => {
    const next: ModifierRule[] = MODIFIERS.map((m) => ensureRule(m, rules)).map((r) => ({
      ...r,
      operations: r.operations.filter((op) => enabledSet.has(op)),
      minLevel: clamp(r.minLevel, 1, maxNumber),
    }));
    return next;
  }, [rules, enabledSet, maxNumber]);

  function updateRule(mod: ModifierCode, updater: (r: ModifierRule) => ModifierRule) {
    const next = normalized.map((r) => (r.modifier === mod ? updater(r) : r));
    onChange(next);
  }

  function toggleOp(mod: ModifierCode, op: OperationCode) {
    updateRule(mod, (r) => {
      const set = new Set(r.operations);
      if (set.has(op)) set.delete(op);
      else set.add(op);
      return { ...r, operations: enabledOperations.filter((x) => set.has(x)) };
    });
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Modifiers</div>

      <div className="grid gap-4">
        {normalized.map((r) => (
          <div key={r.modifier} className="rounded-[20px] bg-[hsl(var(--surface-2))] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={() => updateRule(r.modifier, (x) => ({ ...x, enabled: !x.enabled }))}
                  disabled={disabled}
                  aria-label={`Enable ${r.modifier}`}
                />
                <span>{r.modifier}</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={r.propagate}
                  onChange={() =>
                    updateRule(r.modifier, (x) => ({ ...x, propagate: !x.propagate }))
                  }
                  disabled={disabled || !r.enabled}
                  aria-label={`Propagate ${r.modifier} to later operations`}
                />
                <span>Apply to later operations too</span>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[hsl(var(--muted-fg))]">
                  Operations affected
                </div>
                <div className="flex flex-wrap gap-3">
                  {enabledOperations.map((op) => (
                    <label key={op} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={r.operations.includes(op)}
                        onChange={() => toggleOp(r.modifier, op)}
                        disabled={disabled || !r.enabled}
                        aria-label={`${r.modifier} affects ${op}`}
                      />
                      <span className="font-mono">{op}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-xs font-semibold text-[hsl(var(--muted-fg))]">
                  Unlock at level (within that operation)
                </div>
                <Input
                  inputMode="numeric"
                  value={r.minLevel === 1 ? '' : String(r.minLevel)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') return;

                    const n = Number(raw);
                    if (!Number.isFinite(n)) return;

                    updateRule(r.modifier, (x) => ({
                      ...x,
                      minLevel: clamp(n, 1, maxNumber),
                    }));
                  }}
                  disabled={disabled || !r.enabled}
                />
                <HelpText>Example: unlock after level 7 on MUL.</HelpText>
              </div>
            </div>

            {r.enabled && r.operations.length === 0 ? (
              <div className="text-xs text-[hsl(var(--danger))]">
                Select at least one operation for {r.modifier}.
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  updateRule(r.modifier, (x) => ({
                    ...x,
                    operations: [],
                    enabled: false,
                    propagate: false,
                    minLevel: 1,
                  }))
                }
                disabled={disabled}
              >
                Clear
              </Button>
            </div>
          </div>
        ))}
      </div>

      <HelpText>
        Unlock rules are evaluated per operation level. “Apply to later operations too” is for your
        “carry forward” behavior.
      </HelpText>
    </div>
  );
}
