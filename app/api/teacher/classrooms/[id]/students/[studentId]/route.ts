import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseId(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type RouteCtx = { params: Promise<{ id: string; studentId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const { id: rawClassroomId, studentId: rawStudentId } = await params;
    const classroomId = parseId(rawClassroomId);
    const studentId = parseId(rawStudentId);

    if (!classroomId) return jsonError('Invalid classroom id', 400);
    if (!studentId) return jsonError('Invalid student id', 400);

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: auth.teacher.id },
      select: { id: true },
    });
    if (!classroom) return jsonError('Not allowed', 403);

    const student = await prisma.student.findFirst({
      where: { id: studentId, classroomId },
      select: { id: true, name: true, username: true, level: true },
    });
    if (!student) return jsonError('Student not found', 404);

    return NextResponse.json({ student }, { status: 200 });
  } catch (err) {
    console.error('GET /api/teacher/classrooms/[id]/students/[studentId] error', err);
    return jsonError('Internal server error', 500);
  }
}
