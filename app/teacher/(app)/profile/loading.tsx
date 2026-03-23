import {
  PageHeader,
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Button,
} from '@/components';
import { AppShell, teacherNavItems } from '@/modules';

export default function Loading() {
  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/profile" width="full">
      <PageHeader title="Profile" subtitle={'View your account info'} />

      <Section>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your teacher details</CardDescription>
          </CardHeader>

          <CardContent className="min-h-25">
            <div className="grid gap-6 md:grid-cols-3 md:items-end">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Name
                </div>
                <div className="mt-3">
                  <Skeleton className="h-2 w-48" />
                </div>
              </div>

              <div>
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Email
                </div>
                <div className="mt-3">
                  <Skeleton className="h-2 w-56" />
                </div>
              </div>

              <div className="flex md:justify-end">
                <Button variant="destructive" loading>
                  Reset Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </AppShell>
  );
}
