import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  HelpText,
} from '@/components';

export function SchedulesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Active Schedules Card */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Active schedules</CardTitle>
              <CardDescription>These schedules are currently running.</CardDescription>
            </div>
            <Button loading>Create schedule</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[100px] w-full rounded-[20px] bg-[hsl(var(--surface-2))] animate-pulse"
            />
          ))}
          <HelpText>Tip: you can create multiple schedules...</HelpText>
        </CardContent>
      </Card>

      {/* Inactive Schedules Card */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Inactive schedules</CardTitle>
          <CardDescription>Saved schedules that are currently turned off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-[60px] w-full rounded-[20px] bg-[hsl(var(--surface-2))] flex items-center px-4">
            <span className="text-sm text-[hsl(var(--muted-fg))]">None.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
