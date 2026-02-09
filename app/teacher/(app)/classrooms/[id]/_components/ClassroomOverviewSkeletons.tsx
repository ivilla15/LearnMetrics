import { Card, CardContent, Skeleton } from '@/components';
import { StatsGrid } from '@/components/StatsGrid';

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
    <StatsGrid>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-52" />
          </CardContent>
        </Card>
      ))}
    </StatsGrid>
  );
}
