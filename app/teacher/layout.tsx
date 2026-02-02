import * as React from 'react';
import { redirect } from 'next/navigation';

import { requireTeacher } from '@/core';
import { canAccessTeacherApp, getTeacherEntitlementState } from '@/core/billing/entitlement';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    // keep your existing behavior; you might already redirect in requireTeacher
    redirect('/teacher/login');
  }

  const state = await getTeacherEntitlementState(auth.teacher.id);

  if (!canAccessTeacherApp(state)) {
    redirect('/billing?reason=expired');
  }

  return <>{children}</>;
}
