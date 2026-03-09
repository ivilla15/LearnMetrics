'use client';

import * as React from 'react';

import { Section } from '@/components';

import { useStudentAssignmentsFeed, AssignmentsTimeline } from 'modules';

export function AssignmentsFeed() {
  const all = useStudentAssignmentsFeed('all');

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting ?? false;
        if (hit) void all.loadMore();
      },
      { rootMargin: '500px' },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [all]);

  return (
    <Section>
      <div className="space-y-4">
        <AssignmentsTimeline rows={all.rows} />

        <div ref={sentinelRef} />

        {all.loadingMore ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">Loading more…</div>
        ) : null}

        {!all.nextCursor && all.rows.length > 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">You’re all caught up.</div>
        ) : null}
      </div>
    </Section>
  );
}
