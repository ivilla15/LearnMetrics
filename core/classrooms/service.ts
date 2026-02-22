import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as StudentsRepo from '@/data/students.repo';
import { getProgressionSnapshot, NotFoundError, ConflictError } from '@/core';
import type { OperationCode, ProgressRosterDTO } from '@/types';

export async function getTeacherClassroomOverview(params: {
  classroomId: number;
  teacherId: number;
}) {
  const classroom = await ClassroomsRepo.findClassroomById(params.classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  if (classroom.teacherId !== params.teacherId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  const stats = await ClassroomsRepo.getTeacherClassroomOverviewStats(params.classroomId);
  if (!stats) throw new NotFoundError('Classroom not found');

  return stats;
}

export async function getRosterWithLastAttempt(params: {
  classroomId: number;
  teacherId: number;
}): Promise<ProgressRosterDTO> {
  const { classroomId, teacherId } = params;

  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) throw new NotFoundError('Classroom not found');

  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  const snapshot = await getProgressionSnapshot(classroomId);
  const primaryOperation: OperationCode = snapshot.primaryOperation;

  const students = await StudentsRepo.findStudentsWithLatestAttempt(classroomId, primaryOperation);

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      timeZone: classroom.timeZone,
    },
    students,
  };
}
