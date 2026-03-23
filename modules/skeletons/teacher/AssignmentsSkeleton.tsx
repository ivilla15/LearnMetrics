import { Card, CardHeader, CardContent, Skeleton } from '@/components';

export function AssignmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Recent Assignments Frame */}
      <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <CardHeader className="space-y-2">
          <div className="text-xl font-semibold">Recent assignments</div>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-32 w-full rounded-[18px]" />
            <Skeleton className="h-32 w-full rounded-[18px]" />
            <Skeleton className="h-32 w-full rounded-[18px]" />
          </div>
        </CardContent>
      </Card>

      {/* Table Frame */}
      <Card className="rounded-[28px] border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="space-y-2">
            <div className="text-xl font-semibold">Assignments</div>
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
