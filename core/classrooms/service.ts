import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as StudentsRepo from '@/data/students.repo';
import { NotFoundError, ConflictError } from '@/core/errors';

export type RosterDTO = {
  classroom: { id: number; name?: string };
  students: Array<{
    id: number;
    name: string;
    username: string;
    // ✅ do NOT return password
    level: number;
    lastAttempt: null | {
      assignmentId: number;
      score: number;
      total: number;
      percent: number;
      completedAt: string;
      wasMastery: boolean;
    };
  }>;
};

export async function getRosterWithLastAttempt(params: {
  classroomId: number;
  teacherId: number;
}): Promise<RosterDTO> {
  const { classroomId, teacherId } = params;

  // 1) Confirm classroom exists
  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  // 2) Ownership check
  if (classroom.teacherId !== teacherId) {
    throw new ConflictError('You are not allowed to view this classroom');
  }

  // 3) Fetch students
  const rows = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);

  // 4) Map to DTO (no password)
  const students = rows.map((s) => {
    const a = s.lastAttempt;
    return {
      id: s.id,
      name: s.name,
      username: s.username,
      level: s.level,
      lastAttempt: a
        ? {
            assignmentId: a.assignmentId,
            score: a.score,
            total: a.total,
            percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
            completedAt: a.completedAt.toISOString(),
            wasMastery: a.score === a.total,
          }
        : null,
    };
  });

  return {
    classroom: { id: classroom.id, name: classroom.name },
    students,
  };
}
