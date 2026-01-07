// app/api/teacher/classrooms/[id]/students/[studentId]/reset-access/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';
import {
  generateSetupCode,
  hashSetupCode,
  expiresAtFromNowHours,
  SETUP_CODE_TTL_HOURS,
} from '@/core/auth/setupCodes';

function parseId(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string; studentId: string } },
) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const classroomId = parseId(params.id);
  const studentId = parseId(params.studentId);
  if (!classroomId) return NextResponse.json({ error: 'Invalid classroom id' }, { status: 400 });
  if (!studentId) return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });

  // teacher owns classroom
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: auth.teacher.id },
    select: { id: true },
  });
  if (!classroom) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  // student belongs to classroom
  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId },
    select: { id: true, username: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const setupCode = generateSetupCode();
  const setupCodeHash = hashSetupCode(setupCode);

  await prisma.student.update({
    where: { id: student.id },
    data: {
      setupCodeHash,
      setupCodeExpiresAt: expiresAtFromNowHours(SETUP_CODE_TTL_HOURS),
      mustSetPassword: true,
    },
  });

  return NextResponse.json(
    { setupCode: { studentId: student.id, username: student.username, setupCode } },
    { status: 200 },
  );
}
