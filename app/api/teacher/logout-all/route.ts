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

  // We intentionally don't try to clear cookies here, because cookie writes
  // should happen in route handlers (and you're already doing logout via a route).
  // After this, any existing tokens are invalid, including the current one.
  return NextResponse.json({ ok: true }, { status: 200 });
}
