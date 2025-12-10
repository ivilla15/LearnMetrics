import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as StudentsRepo from '@/data/students.repo';
import { NotFoundError } from '@/core/errors';

export type RosterDTO = {
  classroom: { id: number; name?: string };
  students: Array<{
    id: number;
    name: string;
    username: string;
    level: number;
    lastAttempt: null | {
      assignmentId: number;
      score: number; // 0–100 in your schema
      total: number; // total questions
      percent: number; // score / total * 100
      completedAt: string; // ISO
      wasMastery: boolean; // score === total
    };
  }>;
};

export async function getRosterWithLastAttempt(classroomId: number): Promise<RosterDTO> {
  // 1. Confirm classroom exists.
  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError('Classroom not found');
  }

  // 2. Fetch students in classroom.
  const rows = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);

  // 3. Map to DTO, letting TS infer `s` type.
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

  // 5. Return aggregated RosterDTO.
  return {
    classroom: { id: classroom.id, name: (classroom as any).name },
    students,
  };
}
