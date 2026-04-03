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
      {/* 1. Progress Summary Card */}
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
              <Button variant="secondary" loading>
                Print / Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* 4-stat summary strip */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-8 w-20" />
              </div>
            ))}
          </div>

          {/* Recent tests pills */}
          <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] p-4">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Recent Tests</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-52 rounded-[14px]" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Operation tabs placeholder */}
      <div className="flex gap-2">
        {['All', 'ADD', 'SUB', 'MUL', 'DIV'].map((label) => (
          <div
            key={label}
            className="rounded-[999px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--fg))]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 3. Charts — 2-col + full-width trend */}
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3.5 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-52 w-full rounded-[14px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mastery trend — full width */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3.5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-52 w-full rounded-[14px]" />
        </CardContent>
      </Card>

      {/* 4. Students Table */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Filters apply only to this table.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <Skeleton className="h-[68px] w-40 rounded-xl" />
            <Skeleton className="h-[68px] w-64 rounded-xl" />
            <Skeleton className="h-[68px] w-full max-w-md rounded-xl" />
          </div>

          <div className="overflow-hidden rounded-[28px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--surface-2))]">
                <tr className="text-left border-b border-[hsl(var(--border))]">
                  <th className="py-3 pl-5 pr-3">Student</th>
                  <th className="py-3 px-3 text-center">Level</th>
                  <th className="py-3 px-3">Mastery Rate</th>
                  <th className="py-3 px-3 text-center">Avg Score</th>
                  <th className="py-3 px-3">Trend</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Skeleton className="h-6 w-14 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-3">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="py-3 pr-5">
                      <Skeleton className="h-8 w-28 ml-auto rounded-lg" />
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
