import * as ClassroomsRepo from '@/data/classrooms.repo';
import * as StudentsRepo from '@/data/students.repo';

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
      percent: number; // same as score for now
      completedAt: string; // ISO
      wasMastery: boolean; // score === 100
    };
  }>;
};

export async function getRosterWithLastAttempt(classroomId: number): Promise<RosterDTO> {
  // 1. Confirm classroom exists.
  const classroom = await ClassroomsRepo.findClassroomById(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found');
  }
  // 2. Fetch students in classroom.
  const rows = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);
  // 3. For each, fetch their latest attempt.
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
            percent: a.score,
            // 4. Compute percent and wasMastery.
            completedAt: a.completedAt.toISOString(),
            wasMastery: a.score === 100,
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
