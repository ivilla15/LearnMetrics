import * as React from 'react';
import { AppPage, CalendarSkeleton } from '@/modules';

export default function Loading() {
  return (
    <AppPage title="Calendar" subtitle="Your scheduled assignments & upcoming tests." width="wide">
      <CalendarSkeleton />;
    </AppPage>
  );
}
