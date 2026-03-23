import { Card, CardHeader, CardContent, Skeleton } from '@/components';

export function AssignmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Card Skeleton */}
      <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <CardHeader className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="text-xl font-semibold">Assignment summary</div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Results Table Skeleton */}
      <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <CardHeader className="space-y-2">
          <div className="text-xl font-semibold">Student results</div>
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <Skeleton className="h-10 w-64 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </div>
          <div className="rounded-[28px] overflow-hidden border border-[hsl(var(--border))]">
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-14 w-full border-b border-[hsl(var(--border))] last:border-0"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
