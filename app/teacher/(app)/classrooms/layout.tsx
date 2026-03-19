import * as React from 'react';
import { redirect } from 'next/navigation';

import { requireTeacher, getTeacherEntitlementAccessState } from '@/core';
import { TeacherClassroomsShell } from '@/modules/shell/TeacherClassroomsShell';
import { TrialBanner } from '@/components/billing/TrailBanner';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await requireTeacher();
  if (!auth.ok) redirect('/teacher/login');

  const access = await getTeacherEntitlementAccessState(auth.teacher.id);
  const showTrial = Boolean(access?.isTrial && access?.isActive);

  return (
    <TeacherClassroomsShell>
      {showTrial && access ? <TrialBanner trialEndsAt={access.trialEndsAt} /> : null}
      {children}
    </TeacherClassroomsShell>
  );
}
