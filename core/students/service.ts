import * as StudentsRepo from '@/data/students.repo';
import * as AttemptsRepo from '@/data/attempts.repo';
import { NotFoundError } from '@/core/errors';

export type AttemptHistoryItem = {
  attemptId: number;
  assignmentId: number;
  classroomId: number;
  kind: string;
  score: number;
  total: number;
  percent: number;
  completedAt: string;
  wasMastery: boolean;
  opensAt: string;
  closesAt: string;
};

export type StudentHistoryDTO = {
  student: {
    id: number;
    name: string;
    username: string;
    level: number;
  };
  attempts: AttemptHistoryItem[];
};

export async function getStudentHistory(studentId: number): Promise<StudentHistoryDTO> {
  const student = await StudentsRepo.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const attempts = await AttemptsRepo.findByStudentWithAssignment(studentId);

  const history: AttemptHistoryItem[] = attempts.map((a) => ({
    attemptId: a.id,
    assignmentId: a.assignmentId,
    classroomId: a.Assignment.classroomId,
    kind: a.Assignment.kind,
    score: a.score,
    total: a.total,
    percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
    completedAt: a.completedAt.toISOString(),
    wasMastery: a.score === a.total,
    opensAt: a.Assignment.opensAt.toISOString(),
    closesAt: a.Assignment.closesAt.toISOString(),
  }));

  return {
    student: {
      id: student.id,
      name: student.name,
      username: student.username,
      level: student.level,
    },
    attempts: history,
  };
}
