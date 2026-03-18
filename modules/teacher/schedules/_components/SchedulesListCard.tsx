'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HelpText,
  Button,
} from '@/components';
import type { ScheduleDTO, ScheduleGate } from '@/types';
import { ScheduleCard } from './ScheduleCard';

export function SchedulesListCard(props: {
  title: string;
  description: string;

  schedules: ScheduleDTO[];
  loading: boolean;

  gate?: ScheduleGate;
  onCreate?: () => void;

  onEdit: (s: ScheduleDTO) => void;
  onDelete: (s: ScheduleDTO) => void;

  showTip?: boolean;
}) {
  const { title, description, schedules, loading, gate, onCreate, onEdit, onDelete, showTip } =
    props;

  const canCreate = gate ? gate.ok : true;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          {onCreate ? (
            <Button variant="primary" onClick={onCreate} disabled={!canCreate}>
              Create schedule
            </Button>
          ) : null}
        </div>

        {gate && !gate.ok ? (
          <div className="mt-3 text-xs text-[hsl(var(--muted-fg))]">
            <span>{gate.message} </span>
            <a
              href={gate.upgradeUrl}
              className="font-semibold text-[hsl(var(--fg))] underline underline-offset-4"
            >
              Upgrade
            </a>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">Loading…</div>
        ) : schedules.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">None.</div>
        ) : (
          schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}

        {showTip ? (
          <HelpText>
            Tip: you can create multiple schedules (for example, Tue and Thu practice plus a Fri
            test). Keep only what you want active.
          </HelpText>
        ) : null}
      </CardContent>
    </Card>
  );
}
