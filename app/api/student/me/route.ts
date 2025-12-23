import { prisma } from '@/data/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('student_session')?.value;
  const studentId = Number(raw);

  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, username: true, level: true },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json({ student }, { status: 200 });
}
