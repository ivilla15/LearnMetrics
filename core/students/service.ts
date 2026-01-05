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

// --- Types for roster use (teacher dashboard) ---

// --- Types for roster / teacher dashboard ---

export type StudentRosterRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  lastAttempt: any | null; // matches findStudentsWithLatestAttempt
};

export type BulkCreateStudentArgs = {
  teacherId: number;
  classroomId: number;
  students: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    level: number;
  }[];
};

// Bulk-create students for a classroom (Add students UI)
export async function bulkCreateClassroomStudents(
  args: BulkCreateStudentArgs,
): Promise<StudentRosterRow[]> {
  const { classroomId, students } = args;

  // Optional: verify teacher owns this classroom

  const roster = await StudentsRepo.createManyForClassroom(classroomId, students);
  return roster as StudentRosterRow[];
}

export type UpdateStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
  input: {
    name: string;
    username: string;
    level: number;
  };
};

export async function updateClassroomStudentById(
  args: UpdateStudentArgs,
): Promise<StudentRosterRow> {
  const { classroomId, studentId, input } = args;

  const existing = await StudentsRepo.findById(studentId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Student not found');
  }

  await StudentsRepo.updateById(studentId, {
    name: input.name,
    username: input.username,
    level: input.level,
  });

  // Get updated roster row (keeps lastAttempt consistent)
  const roster = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);
  const updated = roster.find((s) => s.id === studentId);
  if (!updated) {
    throw new NotFoundError('Student not found after update');
  }

  return updated as StudentRosterRow;
}

export type DeleteStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
};

export async function deleteClassroomStudentById(args: DeleteStudentArgs): Promise<void> {
  const { classroomId, studentId } = args;

  const existing = await StudentsRepo.findById(studentId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Student not found');
  }

  // If you later add an AttemptsRepo.deleteByStudent, you can call it here first.
  await StudentsRepo.deleteById(studentId);
}

export type DeleteAllStudentsArgs = {
  teacherId: number;
  classroomId: number;
  deleteAssignments: boolean;
  deleteSchedules: boolean;
};

export async function deleteAllClassroomStudents(args: DeleteAllStudentsArgs): Promise<void> {
  const { classroomId, deleteAssignments, deleteSchedules } = args;

  // TODO: add real cascading deletes when you’re ready
  if (deleteAssignments) {
    // e.g. await AttemptsRepo.deleteByClassroom(classroomId);
    // e.g. await AssignmentsRepo.deleteByClassroom(classroomId);
  }

  if (deleteSchedules) {
    // e.g. await SchedulesRepo.deleteByClassroom(classroomId);
  }

  await StudentsRepo.deleteByClassroomId(classroomId);
}
