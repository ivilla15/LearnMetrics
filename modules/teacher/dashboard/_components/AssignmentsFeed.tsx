'use client';

import * as React from 'react';

import { Section } from '@/components';
import { useStudentAssignmentsFeed, AssignmentsTimeline } from 'modules';

export function AssignmentsFeed() {
  const all = useStudentAssignmentsFeed('all');

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const loadOlderPreserveScroll = React.useCallback(async () => {
    if (all.loadingOlder || !all.nextCursor) return;

    const el = containerRef.current;

    const prevScrollTop = el ? el.scrollTop : window.scrollY;
    const prevScrollHeight = el ? el.scrollHeight : document.documentElement.scrollHeight;

    await all.loadOlder();

    requestAnimationFrame(() => {
      const nextScrollHeight = el ? el.scrollHeight : document.documentElement.scrollHeight;
      const delta = nextScrollHeight - prevScrollHeight;

      if (el) el.scrollTop = prevScrollTop + delta;
      else window.scrollTo({ top: prevScrollTop + delta });
    });
  }, [all]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting ?? false;
        if (hit) void loadOlderPreserveScroll();
      },
      { rootMargin: '500px' },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [loadOlderPreserveScroll]);

  return (
    <Section>
      <div ref={containerRef} className="space-y-4">
        {/* We keep the sentinel at the top for infinite scrolling up if needed */}
        <div ref={sentinelRef} />

        <AssignmentsTimeline
          rows={all.rows}
          loading={all.loading} // Pass the "all" loading state down
          loadingOlder={all.loadingOlder}
          hasMore={!!all.nextCursor}
        />

        {!all.loading && !all.nextCursor && all.rows.length > 0 ? (
          <div className="py-8 text-center text-sm text-[hsl(var(--muted-fg))]">
            You’re all caught up.
          </div>
        ) : null}
      </div>
    </Section>
  );
}
