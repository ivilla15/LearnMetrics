'use client';

import * as React from 'react';
import { HelpText, Input, Button } from '@/components';
import { MODIFIER_CODES, type ModifierCode, type OperationCode } from '@/types/enums';
import type { ModifierRuleDTO } from '@/types/api/progression';
import { clamp } from '@/utils';

const MODIFIERS: ModifierCode[] = [...MODIFIER_CODES];

function ensureRule(mod: ModifierCode, rules: ModifierRuleDTO[]): ModifierRuleDTO {
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

function ModifierRuleCard(props: {
  rule: ModifierRuleDTO;
  enabledOperations: OperationCode[];
  maxNumber: number;
  disabled: boolean;
  updateRule: (mod: ModifierCode, updater: (r: ModifierRuleDTO) => ModifierRuleDTO) => void;
  toggleOp: (mod: ModifierCode, op: OperationCode) => void;
}) {
  const { rule, enabledOperations, maxNumber, disabled, updateRule, toggleOp } = props;

  const [minLevelInput, setMinLevelInput] = React.useState(String(rule.minLevel));

  React.useEffect(() => {
    setMinLevelInput(String(rule.minLevel));
  }, [rule.minLevel]);

  return (
    <div className="rounded-[20px] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={() => updateRule(rule.modifier, (x) => ({ ...x, enabled: !x.enabled }))}
            disabled={disabled}
            aria-label={`Enable ${rule.modifier}`}
          />
          <span>{rule.modifier}</span>
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rule.propagate}
            onChange={() => updateRule(rule.modifier, (x) => ({ ...x, propagate: !x.propagate }))}
            disabled={disabled || !rule.enabled}
            aria-label={`Propagate ${rule.modifier} to later operations`}
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
                  checked={rule.operations.includes(op)}
                  onChange={() => toggleOp(rule.modifier, op)}
                  disabled={disabled || !rule.enabled}
                  aria-label={`${rule.modifier} affects ${op}`}
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
            value={minLevelInput}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw !== '' && !/^\d+$/.test(raw)) return;
              setMinLevelInput(raw);
            }}
            onBlur={() => {
              const fallback = clamp(rule.minLevel, 1, maxNumber);

              if (minLevelInput === '') {
                setMinLevelInput(String(fallback));
                return;
              }

              const n = Number(minLevelInput);
              if (!Number.isFinite(n)) {
                setMinLevelInput(String(fallback));
                return;
              }

              const next = clamp(n, 1, maxNumber);

              updateRule(rule.modifier, (x) => ({
                ...x,
                minLevel: next,
              }));

              setMinLevelInput(String(next));
            }}
            disabled={disabled || !rule.enabled}
          />
          <HelpText>Example: unlock after level 7 on MUL.</HelpText>
        </div>
      </div>

      {rule.enabled && rule.operations.length === 0 ? (
        <div className="text-xs text-[hsl(var(--danger))]">
          Select at least one operation for {rule.modifier}.
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            updateRule(rule.modifier, (x) => ({
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
  );
}

export function ModifierRulesEditor(props: {
  enabledOperations: OperationCode[];
  maxNumber: number;
  rules: ModifierRuleDTO[];
  onChange: (rules: ModifierRuleDTO[]) => void;
  disabled: boolean;
}) {
  const { enabledOperations, maxNumber, rules, onChange, disabled } = props;

  const enabledSet = React.useMemo(() => new Set(enabledOperations), [enabledOperations]);

  const normalized = React.useMemo(() => {
    const next: ModifierRuleDTO[] = MODIFIERS.map((m) => ensureRule(m, rules)).map((r) => ({
      ...r,
      operations: r.operations.filter((op) => enabledSet.has(op)),
      minLevel: clamp(r.minLevel, 1, maxNumber),
    }));
    return next;
  }, [rules, enabledSet, maxNumber]);

  function updateRule(mod: ModifierCode, updater: (r: ModifierRuleDTO) => ModifierRuleDTO) {
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
          <ModifierRuleCard
            key={r.modifier}
            rule={r}
            enabledOperations={enabledOperations}
            maxNumber={maxNumber}
            disabled={disabled}
            updateRule={updateRule}
            toggleOp={toggleOp}
          />
        ))}
      </div>

      <HelpText>
        Unlock rules are evaluated per operation level. “Apply to later operations too” is for your
        “carry forward” behavior.
      </HelpText>
    </div>
  );
}
