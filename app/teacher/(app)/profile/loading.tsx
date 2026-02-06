import { PageHeader, Section, Card, CardHeader, CardContent, Skeleton } from '@/components';
import { AppShell, teacherNavItems } from '@/modules';

export default function Loading() {
  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/profile" width="full">
      <PageHeader title="Profile" subtitle="Loading your account…" />

      <Section>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-52" />
            </div>
          </CardHeader>

          <CardContent className="min-h-[180px]">
            <div className="grid gap-6 md:grid-cols-3 md:items-end">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-56" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-40" />
              </div>

              <div className="flex md:justify-end">
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </AppShell>
  );
}
