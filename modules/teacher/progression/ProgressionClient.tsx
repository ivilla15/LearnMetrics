'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  useToast,
  CardDescription,
  CardTitle,
} from '@/components';
import type { ProgressionPolicyDTO, ProgressionPolicyInputDTO } from '@/types/api/progression';
import type { DomainCode } from '@/types/domain';
import { fetchProgressionPolicy, saveProgressionPolicy } from './actions';
import { ProgressionBasicsForm, EnabledDomainsPicker } from './_components';
import { getApiErrorMessage } from '@/utils/http';
import { isEqual } from '@/utils';

type Props = {
  classroomId: number;
  initialPolicy: ProgressionPolicyDTO;
};

function policyToInput(policy: ProgressionPolicyDTO): ProgressionPolicyInputDTO {
  return {
    enabledDomains: policy.enabledDomains as DomainCode[],
    maxNumber: policy.maxNumber,
  };
}

export function ProgressionClient({ classroomId, initialPolicy }: Props) {
  const toast = useToast();

  const initialInput = React.useMemo(() => policyToInput(initialPolicy), [initialPolicy]);
  const [input, setInput] = React.useState<ProgressionPolicyInputDTO>(initialInput);
  const [busy, setBusy] = React.useState(false);

  const dirty = !isEqual(input, initialInput);

  async function handleReset() {
    const fresh = await fetchProgressionPolicy(classroomId).catch(() => null);
    if (!fresh) {
      setInput(initialInput);
      toast('Reset to last loaded values.', 'success');
      return;
    }
    setInput(policyToInput(fresh));
    toast('Reloaded from server.', 'success');
  }

  async function handleSave() {
    setBusy(true);
    try {
      const saved = await saveProgressionPolicy({ classroomId, input });
      setInput(policyToInput(saved));
      toast('Progression saved.', 'success');
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'Failed to save progression.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <CardTitle>Class progression</CardTitle>
        <CardDescription>
          Choose which domains are enabled and the maximum level students progress to.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ProgressionBasicsForm
          maxNumber={input.maxNumber}
          onChangeMaxNumber={(maxNumber) => setInput((p) => ({ ...p, maxNumber }))}
          disabled={busy}
        />

        <EnabledDomainsPicker
          enabledDomains={input.enabledDomains as DomainCode[]}
          onChange={(enabledDomains) => setInput((p) => ({ ...p, enabledDomains }))}
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
