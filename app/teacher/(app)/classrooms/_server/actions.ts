'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { clampClassroomName } from '@/core/classrooms/validation';

export async function renameClassroomAction(formData: FormData) {
  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomId = Number(formData.get('classroomId'));
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  const parsed = clampClassroomName(formData.get('name'));
  if (!parsed.ok) return;

  await prisma.classroom.updateMany({
    where: { id: classroomId, teacherId: auth.teacher.id },
    data: { name: parsed.name },
  });

  revalidatePath('/teacher/classrooms');
}

export async function deleteClassroomAction(formData: FormData) {
  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomId = Number(formData.get('classroomId'));
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  await prisma.classroom.deleteMany({
    where: { id: classroomId, teacherId: auth.teacher.id },
  });

  revalidatePath('/teacher/classrooms');
}
