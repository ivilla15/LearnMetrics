import { revalidatePath } from 'next/cache';

import { prisma, getTeacherClassroomsWithCounts } from '@/data';
import { requireTeacher } from '@/core';
import { AppShell, teacherNavItems, TeacherClassroomsClient, NewClassroomButton } from '@/modules';
import { PageHeader, Section } from '@/components';

function clampName(raw: unknown) {
  const name = String(raw ?? '').trim();
  if (!name) return { ok: false as const, error: 'Classroom name is required.' };
  if (name.length > 80) return { ok: false as const, error: 'Classroom name must be ≤ 80 chars.' };
  return { ok: true as const, name };
}

async function createClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const parsed = clampName(formData.get('name'));
  if (!parsed.ok) return;

  const tzRaw = formData.get('timeZone');
  const tz = typeof tzRaw === 'string' && tzRaw.trim() ? tzRaw.trim() : 'America/Los_Angeles';

  await prisma.classroom.create({
    data: {
      name: parsed.name,
      teacherId: auth.teacher.id,
      timeZone: tz,
    },
  });

  revalidatePath('/teacher/classrooms');
}

async function renameClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomId = Number(formData.get('classroomId'));
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  const parsed = clampName(formData.get('name'));
  if (!parsed.ok) return;

  const owned = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: auth.teacher.id },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.classroom.update({
    where: { id: classroomId },
    data: { name: parsed.name },
  });

  revalidatePath('/teacher/classrooms');
}

async function deleteClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomId = Number(formData.get('classroomId'));
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  const owned = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: auth.teacher.id },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.classroom.delete({ where: { id: classroomId } });
  revalidatePath('/teacher/classrooms');
}

export default async function TeacherClassroomsPage() {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  const classrooms = await getTeacherClassroomsWithCounts(auth.teacher.id);

  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/classrooms" width="full">
      <PageHeader
        title="Your Classrooms"
        subtitle="Open a class to manage students, schedules, and tests."
        actions={<NewClassroomButton createAction={createClassroomAction} />}
      />

      <Section>
        <TeacherClassroomsClient
          classrooms={classrooms}
          renameAction={renameClassroomAction}
          deleteAction={deleteClassroomAction}
        />
      </Section>
    </AppShell>
  );
}
