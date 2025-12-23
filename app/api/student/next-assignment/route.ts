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
    select: { id: true, classroomId: true },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const now = new Date();

  const assignment = await prisma.assignment.findFirst({
    where: { classroomId: student.classroomId, closesAt: { gt: now } },
    orderBy: { opensAt: 'asc' },
    select: {
      id: true,
      kind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      assignmentMode: true, // ✅
    },
  });

  if (!assignment) {
    return NextResponse.json({ assignment: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      assignment: {
        id: assignment.id,
        kind: assignment.kind,
        mode: assignment.assignmentMode, // ✅ expose as "mode" to UI if you want
        opensAt: assignment.opensAt.toISOString(),
        closesAt: assignment.closesAt.toISOString(),
        windowMinutes: assignment.windowMinutes,
      },
    },
    { status: 200 },
  );
}
