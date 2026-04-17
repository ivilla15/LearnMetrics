'use client';

import * as React from 'react';
import { HelpText } from '@/components';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import { getDomainLabel } from '@/core/domain';

export function EnabledDomainsPicker(props: {
  enabledDomains: DomainCode[];
  onChange: (domains: DomainCode[]) => void;
  disabled: boolean;
}) {
  const { enabledDomains, onChange, disabled } = props;

  const enabledSet = React.useMemo(() => new Set(enabledDomains), [enabledDomains]);

  function toggle(domain: DomainCode) {
    const next = new Set(enabledSet);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);

    const arr = (DOMAIN_CODES as readonly DomainCode[]).filter((d) => next.has(d));
    onChange(arr.length ? arr : ['MUL_WHOLE']);
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-[hsl(var(--fg))]">Enabled domains</div>

      <div className="flex flex-wrap gap-3">
        {(DOMAIN_CODES as readonly DomainCode[]).map((domain) => {
          const checked = enabledSet.has(domain);
          return (
            <label key={domain} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(domain)}
                disabled={disabled}
                aria-label={`Enable ${getDomainLabel(domain)}`}
              />
              <span>{getDomainLabel(domain)}</span>
            </label>
          );
        })}
      </div>

      <HelpText>Students progress through enabled domains in the order listed above.</HelpText>
    </div>
  );
}
