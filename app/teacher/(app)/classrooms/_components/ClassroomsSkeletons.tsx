import { Card, CardContent, CardHeader, Skeleton } from '@/components';

export function ClassroomsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-9 w-9 rounded-(--radius)" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div
                  key={j}
                  className="rounded-(--radius) bg-[hsl(var(--surface-2))] p-3 space-y-2"
                >
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
