import { Skeleton, StatTile, Card, CardContent, CardHeader, CardTitle } from '@/components';

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

export function ClassroomDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Zone 1 — health strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {['Class Mastery Rate', 'Avg Score', 'Active This Week', 'At Risk', 'Next Test'].map(
          (label) => (
            <div
              key={label}
              className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
            >
              <h2 className="text-base font-semibold text-[hsl(var(--fg))]">{label}</h2>
              <Skeleton className="mt-2 h-8 w-20" />
            </div>
          ),
        )}
      </div>

      {/* Zone 2 — needs attention */}
      <div className="space-y-3">
        <div className="h-5 w-36 rounded bg-[hsl(var(--surface-2))]" />
        {['At Risk', 'No Recent Activity', 'Missed Last Test'].map((label) => (
          <div
            key={label}
            className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-sm font-semibold text-[hsl(var(--fg))]">{label}</span>
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Zone 3 — weekly snapshot */}
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-[hsl(var(--surface-2))]" />
        <div className="grid gap-4 md:grid-cols-3">
          {['Level Distribution', 'Operation Distribution', 'Top Missed Facts'].map((label) => (
            <Card
              key={label}
              className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[180px] w-full rounded-[14px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Zone 4 — coming up */}
      <div className="space-y-3">
        <div className="h-5 w-28 rounded bg-[hsl(var(--surface-2))]" />
        <div className="grid gap-4 md:grid-cols-2">
          {['Recent Tests', 'Upcoming Assignments'].map((label) => (
            <Card
              key={label}
              className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-[14px]" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
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
