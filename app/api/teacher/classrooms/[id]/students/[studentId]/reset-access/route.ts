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

type RouteCtx = {
  params: Promise<{ id: string; studentId: string }>;
};

export async function POST(_req: Request, { params }: RouteCtx) {
  const auth = await requireTeacher();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, studentId: rawStudentId } = await params;

  const classroomId = parseId(id);
  const studentId = parseId(rawStudentId);

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
    select: { id: true, username: true, name: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const setupCode = generateSetupCode();
  const setupCodeHash = hashSetupCode(setupCode);

  const expiresAt = expiresAtFromNowHours(SETUP_CODE_TTL_HOURS);

  await prisma.student.update({
    where: { id: student.id },
    data: {
      setupCodeHash,
      setupCodeExpiresAt: expiresAt,
      mustSetPassword: true,
    },
  });

  return NextResponse.json(
    {
      setupCode: {
        studentId: student.id,
        username: student.username,
        setupCode,
        expiresAt: expiresAt.toISOString(),
        name: student.name,
      },
    },
    { status: 200 },
  );
}
