import * as React from 'react';
import { redirect } from 'next/navigation';
import { requireTeacher } from '@/core';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireTeacher();
  if (!auth.ok) redirect('/teacher/login');

  return <>{children}</>;
}
