// core/students/service.ts
import * as StudentsRepo from '@/data/students.repo';
import * as AttemptsRepo from '@/data/attempts.repo';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as AssignmentsRepo from '@/data/assignments.repo';
import { NotFoundError } from '@/core/errors';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';

// -----------------------------
// Student history (student + teacher progress pages)
// -----------------------------

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

export type StudentRosterLastAttempt = {
  attemptId: number;
  completedAt: string;
  percent: number;
  wasMastery: boolean;
} | null;

export type StudentRosterRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  mustSetPassword?: boolean;
  lastAttempt: StudentRosterLastAttempt;
};

export async function getStudentHistory(studentId: number): Promise<StudentHistoryDTO> {
  const student = await StudentsRepo.findStudentById(studentId);
  if (!student) throw new NotFoundError('Student not found');

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
    wasMastery: a.total > 0 && a.score === a.total,
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

// -----------------------------
// Roster + setup codes (teacher dashboard)
// -----------------------------

export type BulkCreateStudentArgs = {
  teacherId: number;
  classroomId: number;
  students: {
    firstName: string;
    lastName: string;
    username: string;
    level: number;
  }[];
};

export type SetupCodeCard = {
  name: string;
  username: string;
  setupCode: string;
  expiresAt: string;
};

export type BulkCreateStudentsResult = {
  students: Awaited<ReturnType<typeof StudentsRepo.findStudentsWithLatestAttempt>>;
  setupCodes: SetupCodeCard[];
};

export async function bulkCreateClassroomStudents(
  args: BulkCreateStudentArgs,
): Promise<BulkCreateStudentsResult> {
  const { teacherId, classroomId, students } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const { created, roster } = await StudentsRepo.createManyForClassroom(classroomId, students);

  const setupCodes: SetupCodeCard[] = created.map((c) => ({
    name: c.name,
    username: c.username,
    setupCode: c.setupCode,
    expiresAt: c.setupCodeExpiresAt.toISOString(),
  }));

  return { students: roster, setupCodes };
}

// -----------------------------
// Update / delete single student
// -----------------------------

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
  const { teacherId, classroomId, studentId, input } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const existing = await StudentsRepo.findStudentByIdInClassroom(classroomId, studentId);
  if (!existing) throw new NotFoundError('Student not found');

  await StudentsRepo.updateById(studentId, {
    name: input.name,
    username: input.username,
    level: input.level,
  });

  const roster = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);
  const updated = roster.find((s) => s.id === studentId);
  if (!updated) throw new NotFoundError('Student not found after update');

  return updated as unknown as StudentRosterRow;
}

export type DeleteStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
};

export async function deleteClassroomStudentById(args: DeleteStudentArgs): Promise<void> {
  const { teacherId, classroomId, studentId } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const existing = await StudentsRepo.findStudentByIdInClassroom(classroomId, studentId);
  if (!existing) throw new NotFoundError('Student not found');

  await StudentsRepo.deleteById(studentId);
}

// -----------------------------
// Delete ALL students in classroom (+ optional cascade)
// -----------------------------

export type DeleteAllStudentsArgs = {
  teacherId: number;
  classroomId: number;
  deleteAssignments: boolean;
  deleteSchedules: boolean;
};

export async function deleteAllClassroomStudents(args: DeleteAllStudentsArgs): Promise<void> {
  const { teacherId, classroomId, deleteAssignments, deleteSchedules } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  await StudentsRepo.deleteStudentsByClassroomId(classroomId);

  if (deleteAssignments) {
    const maybeDelete = (AssignmentsRepo as Record<string, unknown>)[
      'deleteAssignmentsByClassroomId'
    ];

    if (typeof maybeDelete === 'function') {
      await (maybeDelete as (id: number) => Promise<unknown>)(classroomId);
    }
  }

  if (deleteSchedules) {
    await SchedulesRepo.deleteSchedulesByClassroomId(classroomId);
  }
}
