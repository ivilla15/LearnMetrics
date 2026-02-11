import * as React from 'react';

import { requireTeacher } from '@/core/auth/requireTeacher';
import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';
import PrintCardsClient from './PrintCardsClient';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch';

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

  let classroomName: string | null = null;
  try {
    const res = await fetch(`${baseUrl}/api/classrooms/${classroomId}/roster`, {
      cache: 'no-store',
      headers: { cookie },
    });

    if (res.ok) {
      const dto = await res.json().catch(() => null);
      classroomName = typeof dto?.classroom?.name === 'string' ? dto.classroom.name : null;
    }
  } catch {
    classroomName = null;
  }

  const title = classroomName ?? `Classroom ${classroomId}`;
  const currentPath = `/teacher/classrooms/${classroomId}/print-cards`;

  return (
    <>
      <div className="lm-no-print">
        <PageHeader
          title={title}
          subtitle="Hand one card to each student. Each setup code is one-time use."
        />

        <Section className="space-y-4">
          <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        </Section>
      </div>

      <Section className="lm-print-root">
        <PrintCardsClient classroomId={classroomId} />
      </Section>
    </>
  );
}
