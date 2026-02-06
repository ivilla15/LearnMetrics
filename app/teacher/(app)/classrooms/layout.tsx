import * as React from 'react';
import { redirect } from 'next/navigation';

import { requireTeacher } from '@/core';
import { getTeacherEntitlement } from '@/core/billing/entitlement';
import { TeacherClassroomsShell } from '@/modules/shell/TeacherClassroomsShell';
import { TrialBanner } from '@/components/billing/TrailBanner';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await requireTeacher();
  if (!auth.ok) redirect('/teacher/login');

  const ent = await getTeacherEntitlement(auth.teacher.id);
  const showTrial = ent?.plan === 'TRIAL' && ent.status === 'ACTIVE';

  return (
    <TeacherClassroomsShell>
      {showTrial ? <TrialBanner trialEndsAt={ent.trialEndsAt} /> : null}
      {children}
    </TeacherClassroomsShell>
  );
}
