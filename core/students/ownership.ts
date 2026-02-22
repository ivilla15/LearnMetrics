import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function assertTeacherOwnsStudent(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
}) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    select: { id: true, teacherId: true },
  });

  if (!classroom) throw new NotFoundError('Classroom not found');
  if (classroom.teacherId !== params.teacherId) throw new ConflictError('Not allowed');

  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    select: { id: true, classroomId: true },
  });

  if (!student || student.classroomId !== params.classroomId) {
    throw new NotFoundError('Student not found');
  }

  return student;
}
