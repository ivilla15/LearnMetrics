'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, Button, useToast, HelpText } from '@/components';
import type { ProgressionPolicyDTO, ProgressionPolicyInput } from '@/types/progression';

import { fetchProgressionPolicy, saveProgressionPolicy } from './actions';
import {
  ProgressionBasicsForm,
  EnabledOperationsPicker,
  OperationOrderEditor,
  ModifierRulesEditor,
} from './_components';
import { getApiErrorMessage, isEqual, normalizePolicyInput, toInput } from '@/utils';

type Props = {
  classroomId: number;
  initialPolicy: ProgressionPolicyDTO;
};

export function ProgressionClient({ classroomId, initialPolicy }: Props) {
  const toast = useToast();

  const initialInput = React.useMemo(
    () => normalizePolicyInput(toInput(initialPolicy)),
    [initialPolicy],
  );
  const [input, setInput] = React.useState<ProgressionPolicyInput>(initialInput);
  const [busy, setBusy] = React.useState(false);

  const dirty = !isEqual(input, initialInput);

  async function handleReset() {
    const fresh = await fetchProgressionPolicy(classroomId).catch(() => null);
    if (!fresh) {
      setInput(initialInput);
      toast('Reset to last loaded values.', 'success');
      return;
    }
    const next = normalizePolicyInput(toInput(fresh));
    setInput(next);
    toast('Reloaded from server.', 'success');
  }

  async function handleSave() {
    setBusy(true);
    try {
      const normalized = normalizePolicyInput(input);

      const saved = await saveProgressionPolicy({
        classroomId,
        input: normalized,
      });

      const next = normalizePolicyInput(toInput(saved));
      setInput(next);

      toast('Progression saved.', 'success');
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'Failed to save progression.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <CardHeader className="space-y-2">
        <div className="text-base font-semibold text-[hsl(var(--fg))]">Class progression</div>
        <HelpText>
          Choose which operations are enabled, the order students progress through them, and when
          decimals/fractions unlock.
        </HelpText>
      </CardHeader>

      <CardContent className="space-y-6">
        <ProgressionBasicsForm
          maxNumber={input.maxNumber}
          onChangeMaxNumber={(maxNumber) => setInput((p) => ({ ...p, maxNumber }))}
          disabled={busy}
        />

        <EnabledOperationsPicker
          enabledOperations={input.enabledOperations}
          onChange={(enabledOperations) => setInput((p) => ({ ...p, enabledOperations }))}
          disabled={busy}
        />

        <OperationOrderEditor
          enabledOperations={input.enabledOperations}
          operationOrder={input.operationOrder}
          onChange={(operationOrder) => setInput((p) => ({ ...p, operationOrder }))}
          disabled={busy}
        />

        <ModifierRulesEditor
          enabledOperations={input.enabledOperations}
          maxNumber={input.maxNumber}
          rules={input.modifierRules}
          onChange={(modifierRules) => setInput((p) => ({ ...p, modifierRules }))}
          disabled={busy}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleReset} disabled={busy}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
