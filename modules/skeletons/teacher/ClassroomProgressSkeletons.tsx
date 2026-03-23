import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components';

export function ProgressSectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* 1. Progress Summary Card - Exact Header Match */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Class Progress</CardTitle>
              <CardDescription>Actionable insights for the last 30 days.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button loading>View student</Button>
              <Button variant="secondary" loading>
                Assign test
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* StatPills - 3 Rows exactly matching the client grid */}
          {[...Array(3)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[76px] w-full rounded-[18px] bg-[hsl(var(--surface-2))] animate-pulse"
                />
              ))}
            </div>
          ))}

          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">Today’s Focus</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                  Prioritized students who need attention right now.
                </div>
              </div>

              <Button variant="secondary" size="sm" loading>
                Filter at-risk
              </Button>
            </div>
          </div>

          {/* Last 3 Tests Section */}
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Last 3 tests</div>
            <div className="my-1 text-xs text-[hsl(var(--muted-fg))]">
              Quick snapshot of recent performance.
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[158px] w-full rounded-[14px] bg-[hsl(var(--surface-2))] animate-pulse"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Distribution Cards (Score & Level) */}
      <div className="grid gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-8 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Students Table Card - Matching columns and padding exactly */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <div className="text-xl font-semibold leading-none tracking-tight">Students</div>
          <div className="mt-2 text-sm text-[hsl(var(--muted-fg))]">
            Filters apply only to this table.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar Skeletons */}
          <div className="flex flex-wrap items-end gap-4">
            <Skeleton className="h-[68px] w-40 rounded-xl" />
            <Skeleton className="h-[68px] w-64 rounded-xl" />
            <Skeleton className="h-[68px] w-full max-w-md rounded-xl" />
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--surface-2))]">
                <tr className="text-left border-b border-[hsl(var(--border))]">
                  <th className="py-3 pl-5 pr-3">Student</th>
                  <th className="py-3 px-3 text-center w-20">Level</th>
                  <th className="py-3 px-3 w-32">Last attempt</th>
                  <th className="py-3 px-3 text-center w-20">Last %</th>
                  <th className="py-3 px-3 text-center w-20">Avg %</th>
                  <th className="py-3 px-3 text-center w-20">Mastery %</th>
                  <th className="py-3 px-3 text-center w-20">Streak</th>
                  <th className="py-3 px-3 w-32">Trend</th>
                  <th className="py-3 pl-3 pr-5 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <Skeleton className="h-14 w-40" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-10 w-24" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-10 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="py-3 pr-5">
                      <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
