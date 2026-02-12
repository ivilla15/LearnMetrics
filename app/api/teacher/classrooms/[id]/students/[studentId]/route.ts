import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { jsonError, parseId } from '@/utils';
import { handleApiError } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

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

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const student = await prisma.student.findFirst({
      where: { id: studentId, classroomId },
      select: { id: true, name: true, username: true },
    });
    if (!student) return jsonError('Student not found', 404);

    return NextResponse.json({ student }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
