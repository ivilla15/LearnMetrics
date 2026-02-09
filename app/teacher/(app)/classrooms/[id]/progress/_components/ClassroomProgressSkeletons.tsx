import { Card, CardContent, CardHeader, Skeleton } from '@/components';

export function ProgressSectionSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-(--radius)" />
              <Skeleton className="h-9 w-28 rounded-(--radius)" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[18px]" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[18px]" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-[18px]" />
          <Skeleton className="h-40 w-full rounded-[18px]" />
        </CardContent>
      </Card>

      <Skeleton className="h-60 w-full rounded-[28px]" />
      <Skeleton className="h-60 w-full rounded-[28px]" />
      <Skeleton className="h-60 w-full rounded-[28px]" />
      <Skeleton className="h-80 w-full rounded-[28px]" />
    </div>
  );
}
