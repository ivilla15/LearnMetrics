'use client';

import * as React from 'react';
import { formatInTimeZone } from 'date-fns-tz';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import type { CalendarItemRow } from '@/types';
import { DayTile } from './DayTile';
import { buildMonthGrid, monthLabel, sameDay } from '@/utils/calendar';

type Props = {
  month: Date;
  tz: string;
  loading: boolean;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;

  byDay: Map<string, CalendarItemRow[]>;
  onOpenDetails: (item: CalendarItemRow) => void;

  onOpenDayMobile: (dayKey: string) => void;
};

export function MonthGrid({
  month,
  tz,
  loading,
  onPrev,
  onToday,
  onNext,
  byDay,
  onOpenDetails,
  onOpenDayMobile,
}: Props) {
  const days = React.useMemo(() => buildMonthGrid(month), [month]);
  const monthIdx = month.getMonth();

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{monthLabel(month)}</CardTitle>
            <CardDescription>Click an item to view details.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onPrev}>
              Prev
            </Button>
            <Button variant="secondary" onClick={onToday}>
              Today
            </Button>
            <Button variant="secondary" onClick={onNext}>
              Next
            </Button>
          </div>
        </div>

        {loading ? <div className="text-xs text-[hsl(var(--muted-fg))]">Loading month…</div> : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Desktop grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-[hsl(var(--muted-fg))]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const key = formatInTimeZone(d, tz, 'yyyy-MM-dd');
              const items = byDay.get(key) ?? [];
              const isToday = sameDay(d, new Date());
              const inMonth = d.getMonth() === monthIdx;

              return (
                <DayTile
                  key={key}
                  date={d}
                  tz={tz}
                  inMonth={inMonth}
                  isToday={isToday}
                  items={items}
                  onOpenDetails={onOpenDetails}
                />
              );
            })}
          </div>
        </div>

        {/* Mobile: usable list */}
        <div className="md:hidden space-y-2">
          <div className="text-xs font-semibold text-[hsl(var(--muted-fg))]">Select a day</div>

          <div className="space-y-2">
            {days
              .filter((d) => d.getMonth() === monthIdx)
              .map((d) => {
                const key = formatInTimeZone(d, tz, 'yyyy-MM-dd');
                const items = byDay.get(key) ?? [];
                const isToday = sameDay(d, new Date());

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onOpenDayMobile(key)}
                    className={[
                      'w-full rounded-[18px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)] p-3 text-left',
                      'hover:bg-[hsl(var(--surface-2))] transition-colors',
                      isToday ? 'ring-2 ring-[hsl(var(--brand)/0.35)]' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        {formatInTimeZone(d, tz, 'EEE, MMM d')}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-fg))]">
                        {items.length} item{items.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
