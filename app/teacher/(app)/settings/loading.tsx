import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';
import { AppShell, teacherNavItems } from '@/modules';

export default function Loading() {
  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/settings" width="full">
      <PageHeader title="Settings" subtitle="Loading your settings…" />

      <Section>
        <div className="grid gap-6">
          {/* Billing */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-60" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 h-[150px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-28" />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-44" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-40" />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-52" />
              </div>
            </CardHeader>

            <CardContent className="space-y-2 h-[120px]">
              <Skeleton className="h-9 w-44" />
              <Skeleton className="h-4 w-64" />
            </CardContent>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
