import { Card, CardContent, CardHeader, Skeleton } from '@/components';

export function PrintCardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-[18px] border-0">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
