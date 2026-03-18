'use client';

import * as React from 'react';
import { formatInTimeZone } from 'date-fns-tz';

import { Pill } from '@/components';
import type { CalendarItemRowDTO } from '@/types';
import { formatAssignmentMode, formatAssignmentType } from '@/types';
import { isProjection, toIso } from '@/utils/calendar';

type Props = {
  date: Date;
  tz: string;
  inMonth: boolean;
  isToday: boolean;
  items: CalendarItemRowDTO[];
  onOpenDetails: (item: CalendarItemRowDTO) => void;
  onOpenDay?: () => void;
};

function itemTitle(item: CalendarItemRowDTO) {
  if (isProjection(item)) {
    return item.targetKind === 'PRACTICE_TIME' ? 'Projected practice time' : 'Projected assignment';
  }

  const typeLabel = formatAssignmentType(item.type);
  const modeLabel = formatAssignmentMode(item.mode);
  const isPracticeTime = item.targetKind === 'PRACTICE_TIME';

  return isPracticeTime ? `Practice time · ${modeLabel}` : `${typeLabel} · ${modeLabel}`;
}

export function DayTile({ date, tz, inMonth, isToday, items, onOpenDetails, onOpenDay }: Props) {
  const firstTwo = items.slice(0, 2);
  const extra = items.length - firstTwo.length;

  return (
    <div
      className={[
        'min-h-27.5 rounded-[18px] bg-[hsl(var(--surface))] p-2 shadow-[0_4px_10px_rgba(0,0,0,0.08)]',
        !inMonth ? 'opacity-60' : '',
        isToday ? 'ring-2 ring-[hsl(var(--brand)/0.35)]' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenDay}
          className={[
            'text-xs font-semibold text-[hsl(var(--fg))]',
            onOpenDay ? 'cursor-pointer hover:underline' : 'cursor-default',
          ].join(' ')}
        >
          {date.getDate()}
        </button>

        {isToday ? <div className="text-[10px]">{Pill('Today', 'muted')}</div> : null}
      </div>

      <div className="mt-2 space-y-1">
        {firstTwo.map((item) => {
          const proj = isProjection(item);
          const key = proj ? `p:${item.scheduleId}:${item.runDate}` : `a:${item.assignmentId}`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpenDetails(item)}
              className="w-full text-left rounded-xl bg-[hsl(var(--surface-2))] px-2 py-1 text-xs hover:bg-[hsl(var(--brand)/0.10)] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[hsl(var(--fg))] truncate">
                  {itemTitle(item)}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-fg))]">
                  {formatInTimeZone(toIso(item.opensAt), tz, 'h:mm a')}
                </span>
              </div>
            </button>
          );
        })}

        {extra > 0 ? (
          <div className="text-[11px] text-[hsl(var(--muted-fg))] px-1">+{extra} more</div>
        ) : null}

        {items.length === 0 ? (
          <div className="text-[11px] text-[hsl(var(--muted-fg))] px-1">—</div>
        ) : null}
      </div>
    </div>
  );
}
