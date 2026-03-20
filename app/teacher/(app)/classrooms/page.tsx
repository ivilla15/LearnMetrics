import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';

import {
  buildClassroomsGate,
  clampClassroomName,
  createTeacherClassroom,
  getTeacherEntitlementAccessState,
  requireTeacher,
} from '@/core';
import { prisma } from '@/data/prisma';

import { PageHeader, Section } from '@/components';
import { NewClassroomButton } from '@/modules';
import { ClassroomsGridSkeleton, ClassroomsSection } from './_components';

async function createClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const parsed = clampClassroomName(formData.get('name'));
  if (!parsed.ok) return;

  const tzRaw = formData.get('timeZone');
  const tz = typeof tzRaw === 'string' && tzRaw.trim() ? tzRaw.trim() : 'America/Los_Angeles';

  const access = await getTeacherEntitlementAccessState(auth.teacher.id);
  const classroomCount = await prisma.classroom.count({
    where: { teacherId: auth.teacher.id },
  });

  const gate = buildClassroomsGate({
    access,
    classroomCount,
  });

  if (!gate.ok) {
    return;
  }

  await createTeacherClassroom({
    teacherId: auth.teacher.id,
    name: parsed.name,
    timeZone: tz,
  });

  revalidatePath('/teacher/classrooms');
}

export default async function TeacherClassroomsPage() {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  return (
    <>
      <PageHeader
        title="Your Classrooms"
        subtitle="Open a class to manage students, schedules, and tests."
        actions={<NewClassroomButton createAction={createClassroomAction} />}
      />

      <Section>
        <Suspense fallback={<ClassroomsGridSkeleton />}>
          <ClassroomsSection teacherId={auth.teacher.id} />
        </Suspense>
      </Section>
    </>
  );
}
