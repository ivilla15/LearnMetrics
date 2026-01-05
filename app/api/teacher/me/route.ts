import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { cookies } from 'next/headers';

function parseId(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('teacher_session')?.value;
  const teacherId = parseId(raw);

  if (!teacherId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true, email: true },
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  return NextResponse.json({ teacher }, { status: 200 });
}
