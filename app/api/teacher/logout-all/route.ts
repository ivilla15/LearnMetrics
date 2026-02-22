import { NextResponse } from 'next/server';
import { requireTeacher } from '@/core';
import { prisma } from '@/data/prisma';
import { jsonError } from '@/utils';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);

  await prisma.teacherSession.deleteMany({
    where: { teacherId: auth.teacher.id },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
