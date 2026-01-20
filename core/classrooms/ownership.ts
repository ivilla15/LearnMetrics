import * as ClassroomsRepo from '@/data';
import { ConflictError, NotFoundError } from '@/core';

export async function assertTeacherOwnsClassroom(teacherId: number, classroomId: number) {
  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');
  if (classroom.teacherId !== teacherId) throw new ConflictError('Not allowed');
  return classroom;
}
