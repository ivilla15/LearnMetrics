import { prisma } from '@/data';
import { NotFoundError } from '@/core/errors';

export async function getTeacherClassroomHeader(params: {
  teacherId: number;
  classroomId: number;
}) {
  const row = await prisma.classroom.findFirst({
    where: { id: params.classroomId, teacherId: params.teacherId },
    select: { id: true, name: true, timeZone: true },
  });

  if (!row) throw new NotFoundError('Classroom not found');
  return row;
}
