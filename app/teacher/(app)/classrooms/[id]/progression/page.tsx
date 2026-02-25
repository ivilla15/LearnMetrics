import * as React from 'react';

import { requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';

import { PageHeader, Section } from '@/components';
import { ClassroomSubNav } from '@/modules';
import { ProgressionClient } from '@/modules';

import type { ProgressionPolicyDTO } from '@/types';
import { getApiErrorMessage } from '@/utils/http';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;
  }

  const { id } = await params;

  let classroomId: number;
  try {
    const parsed = classroomIdParamSchema.parse({ id });
    classroomId = parsed.id;
  } catch {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  const baseUrl = getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(`${baseUrl}/api/teacher/classrooms/${classroomId}/progression`, {
    method: 'GET',
    headers: cookie ? { cookie } : undefined,
    cache: 'no-store',
  });

  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = getApiErrorMessage(payload, 'Failed to load progression policy');
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }

  const policy =
    payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).policy as ProgressionPolicyDTO | undefined)
      : undefined;

  if (!policy) {
    return (
      <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid response: missing policy</div>
    );
  }

  const title = 'Progression';
  const currentPath = `/teacher/classrooms/${classroomId}/progression`;

  return (
    <>
      <PageHeader title={title} subtitle="Configure operations, level range, and modifiers." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />

        <ProgressionClient classroomId={classroomId} initialPolicy={policy} />
      </Section>
    </>
  );
}
