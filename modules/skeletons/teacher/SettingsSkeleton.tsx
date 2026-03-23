import {
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Button,
} from '@/components';

export function SettingsSkeleton() {
  return (
    <Section>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your plan and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Plan
                </div>
                <div className="mt-3">
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Status
                </div>
                <div className="mt-3">
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Billing
                </div>
                <div className="mt-3">
                  <Skeleton className="h-2 w-44" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" loading>
                Manage billing
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Keep your account safe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" loading>
              Sign out of all devices
            </Button>
            <div className="text-[14px] text-[hsl(var(--muted-fg))]">
              If you suspect someone else has access, reset your password and sign out everywhere.
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
