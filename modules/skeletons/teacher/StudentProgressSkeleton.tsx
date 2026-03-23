import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Button,
  Label,
  Input,
} from '@/components';

export function StudentProgressSkeleton() {
  return (
    <div className="space-y-6">
      {/* 1. Summary Card Skeleton */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Performance summary for the selected range.</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <Label>Range (days)</Label>
                <div className="flex items-center gap-2">
                  <Input disabled value="30" className="w-27.5" />
                  <Button variant="secondary" loading>
                    Apply
                  </Button>
                </div>
              </div>
              <Button variant="secondary" loading>
                Back to class
              </Button>
              <Button variant="secondary" loading>
                Print report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 8 Stat Pills */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-[86px] w-full rounded-[18px] bg-[hsl(var(--surface-2))] animate-pulse"
              />
            ))}
          </div>

          {/* Practice Summary Placeholder */}
          <div className="h-[74px] w-full rounded-[18px] bg-[hsl(var(--surface-2))] animate-pulse" />

          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Missed Facts Skeleton */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Most Missed Facts</CardTitle>
          <CardDescription>Facts this student missed most...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[82px] w-full rounded-[18px] bg-[hsl(var(--surface-2))] animate-pulse"
            />
          ))}
        </CardContent>
      </Card>

      {/* 3. Attempt Explorer Skeleton */}
      <div className="h-[400px] w-full rounded-[28px] bg-[hsl(var(--surface-2))] animate-pulse" />
    </div>
  );
}
