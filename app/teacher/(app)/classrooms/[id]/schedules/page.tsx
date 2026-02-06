import { requireTeacher } from '@/core/auth/requireTeacher';
import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils';
import { SchedulesClient } from '@/modules';
import { getTeacherEntitlement } from '@/core/billing/entitlement';

function buildScheduleGate(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
  trialEndsAt: Date | string | null | undefined;
  scheduleCount: number;
}) {
  const plan = (params.plan ?? 'TRIAL').toUpperCase();
  const status = (params.status ?? 'ACTIVE').toUpperCase();

  // no active entitlement
  if (status !== 'ACTIVE') {
    return {
      ok: false as const,
      reason:
        status === 'CANCELED'
          ? ('SUBSCRIPTION_CANCELED' as const)
          : ('SUBSCRIPTION_EXPIRED' as const),
      message:
        status === 'CANCELED'
          ? 'Your subscription is canceled. Upgrade to re-enable scheduling.'
          : 'Your access is no longer active. Upgrade to re-enable scheduling.',
      upgradeHref:
        status === 'CANCELED'
          ? '/billing?reason=canceled&plan=pro'
          : '/billing?reason=expired&plan=pro',
    };
  }

  // TRIAL limit: 1 schedule total
  if (plan === 'TRIAL' && params.scheduleCount >= 1) {
    return {
      ok: false as const,
      reason: 'TRIAL_LIMIT_REACHED' as const,
      message: 'Trial accounts can create 1 schedule per classroom. Upgrade to add more schedules.',
      upgradeHref: '/billing?plan=pro',
    };
  }

  return { ok: true as const };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(`${baseUrl}/api/classrooms/${classroomId}/schedules`, {
    cache: 'no-store',
    headers: { cookie },
  });

  if (!res.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load schedules</div>;
  }

  const dto = await res.json();
  const initialSchedules = Array.isArray(dto?.schedules) ? dto.schedules : [];

  const currentPath = `/teacher/classrooms/${classroomId}/schedules`;

  const ent = await getTeacherEntitlement(auth.teacher.id);
  const scheduleCount = initialSchedules.filter((s: { isActive?: boolean }) => s.isActive).length;

  const gate = buildScheduleGate({
    plan: ent?.plan,
    status: ent?.status,
    trialEndsAt: ent?.trialEndsAt,
    scheduleCount,
  });

  return (
    <>
      <PageHeader title="Schedules" subtitle="Manage weekly test schedules for this classroom." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <SchedulesClient classroomId={classroomId} initial={initialSchedules} gate={gate} />
      </Section>
    </>
  );
}
