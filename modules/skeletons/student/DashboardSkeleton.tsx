'use client';

import * as React from 'react';
import { Section } from '@/components';
import { formatWeekdayMonthDay } from '@/utils';
import { AssignmentRowLoadingCard } from '../../student';

// Helper to match your AssignmentsTimeline logic exactly
function getRelativeDateInfo(delta: number) {
  const d = new Date();
  d.setDate(d.getDate() + delta);

  let title = formatWeekdayMonthDay(d);
  if (delta === -1) title = 'Yesterday';
  if (delta === 0) title = 'Today';
  if (delta === 1) title = 'Tomorrow';

  return {
    title,
    subtitle: formatWeekdayMonthDay(d),
  };
}

function DayHeaderStatic(props: { title: string; subtitle: string }) {
  return (
    <div className="px-1">
      {/* Real Text: Matches 'text-sm font-bold uppercase' */}
      <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--fg))]">
        {props.title}
      </div>
      {/* Real Text: Matches 'mt-1 text-sm font-medium' */}
      <div className="mt-1 text-sm font-medium text-[hsl(var(--fg))]">{props.subtitle}</div>
    </div>
  );
}

export function StudentDashboardSkeleton() {
  const yesterday = getRelativeDateInfo(-1);
  const today = getRelativeDateInfo(0);
  const tomorrow = getRelativeDateInfo(1);

  return (
    <Section className="mt-4">
      <div className="space-y-6">
        {/* Yesterday Group */}
        <div className="space-y-3">
          <DayHeaderStatic title={yesterday.title} subtitle={yesterday.subtitle} />
          <div className="space-y-3">
            <AssignmentRowLoadingCard />
          </div>
        </div>

        {/* Today Group */}
        <div className="space-y-3">
          <DayHeaderStatic title={today.title} subtitle={today.subtitle} />
          <div className="space-y-3">
            <AssignmentRowLoadingCard />
          </div>
        </div>

        {/* Tomorrow Group */}
        <div className="space-y-3">
          <DayHeaderStatic title={tomorrow.title} subtitle={tomorrow.subtitle} />
          <div className="space-y-3">
            <AssignmentRowLoadingCard />
          </div>
        </div>
      </div>
    </Section>
  );
}
