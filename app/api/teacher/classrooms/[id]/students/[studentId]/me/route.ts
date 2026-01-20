import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { jsonError, parseId } from '@/utils';
import { handleApiError } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

type Ctx = { params: Promise<{ id: string; studentId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const { id, studentId } = await params;
    const classroomId = parseId(id);
    const sid = parseId(studentId);

    if (!classroomId) return jsonError('Invalid classroom id', 400);
    if (!sid) return jsonError('Invalid student id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const student = await prisma.student.findFirst({
      where: { id: sid, classroomId },
      select: { id: true, name: true, username: true },
    });

    if (!student) return jsonError('Student not found in classroom', 404);

    return NextResponse.json(
      { studentId: student.id, name: student.name, username: student.username },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
