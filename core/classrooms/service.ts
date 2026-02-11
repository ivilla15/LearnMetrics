import * as ClassroomsRepo from '@/data';
import * as StudentsRepo from '@/data';
import { NotFoundError, ConflictError } from '@/core';
import { ProgressRosterDTO } from '@/types';

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
  if (!stats) throw new NotFoundError('Classroom not found'); // safety
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

  const rows = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);

  const students = rows.map((s) => {
    const a = s.lastAttempt;
    return {
      id: s.id,
      name: s.name,
      username: s.username,
      level: s.level,
      mustSetPassword: s.mustSetPassword,
      lastAttempt: a
        ? {
            assignmentId: a.assignmentId,
            score: a.score,
            total: a.total,
            percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
            completedAt: a.completedAt,
            wasMastery: a.total > 0 && a.score === a.total,
          }
        : null,
    };
  });

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      timeZone: classroom.timeZone,
    },
    students,
  };
}
