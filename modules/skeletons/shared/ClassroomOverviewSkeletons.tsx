import { Skeleton, StatTile } from '@/components';

export function ClassroomHeaderSkeleton() {
  return (
    <header className="w-full px-6 sm:px-8 pt-6 pb-4 relative z-10 bg-[hsl(var(--bg))] shadow-[2px_0_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    </header>
  );
}

export function ClassroomSubNavSkeleton() {
  return (
    <div className="border-b border-[hsl(var(--border))]">
      <div className="flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-3">
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClassroomStatsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <StatTile
        label="Students"
        value={<Skeleton className="h-8 w-16" />}
        helper={<span>Total enrolled in this classroom.</span>}
      />

      <StatTile
        label="Active"
        value={<Skeleton className="h-8 w-12" />}
        tone="default"
        helper={<span>Students who already set a password.</span>}
      />

      <StatTile
        label="Needs setup"
        value={<Skeleton className="h-8 w-12" />}
        helper={<span>Still need a new setup code / activation.</span>}
      />

      <StatTile
        label="Active schedules"
        value={<Skeleton className="h-8 w-12" />}
        helper={<span>Weekly schedules currently turned on.</span>}
      />

      <StatTile
        label="Next test"
        value={<Skeleton className="h-8 w-32" />}
        helper={<Skeleton className="h-4 w-48 mt-1" />}
      />

      <StatTile
        label="Mastery rate (7 days)"
        value={<Skeleton className="h-8 w-20" />}
        helper={<Skeleton className="h-4 w-40 mt-1" />}
      />
    </div>
  );
}
