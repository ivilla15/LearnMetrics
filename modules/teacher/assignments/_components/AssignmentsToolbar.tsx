'use client';

import * as React from 'react';
import { Input, Label } from '@/components';
import type { AssignmentStatusFilter } from '@/types';

const STATUS_OPTIONS: Array<[AssignmentStatusFilter, string]> = [
  ['all', 'All'],
  ['open', 'Open'],
  ['finished', 'Finished'],
  ['upcoming', 'Upcoming'],
];

export function AssignmentsToolbar(props: {
  status: AssignmentStatusFilter;
  search: string;
  setSearch: (v: string) => void;
  onChangeStatus: (s: AssignmentStatusFilter) => void;
}) {
  const { status, search, setSearch, onChangeStatus } = props;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grid gap-1 min-w-55">
        <Label htmlFor="assign-search">Search</Label>
        <Input
          id="assign-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to filter…"
        />
      </div>

      <div className="grid gap-1">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(([key, label]) => {
            const active = status === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChangeStatus(key)}
                className={[
                  'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
