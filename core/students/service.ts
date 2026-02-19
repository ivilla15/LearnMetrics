import * as StudentsRepo from '@/data/students.repo';
import * as AttemptsRepo from '@/data/attempts.repo';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as AssignmentsRepo from '@/data/assignments.repo';
import { NotFoundError } from '@/core/errors';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import type { BulkCreateStudentArgs } from '@/types';
import type { OperationCode } from '@/types/progression';
import type { StudentRosterRow } from '@/types/roster';
import { initializeStudentProgressForNewStudent } from '@/core/progression/initStudentProgress.service';
import { getClassroomRosterWithLatestAttempt } from './roster.service';

// -----------------------------
// Student history (student + teacher progress pages)
// -----------------------------

export type AttemptHistoryItem = {
  attemptId: number;
  assignmentId: number;
  classroomId: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  score: number;
  total: number;
  percent: number;
  completedAt: string;
  wasMastery: boolean;
  opensAt: string;
  closesAt: string | null;
};

export type StudentHistoryDTO = {
  student: {
    id: number;
    name: string;
    username: string;
  };
  attempts: AttemptHistoryItem[];
};

export async function getStudentHistory(studentId: number): Promise<StudentHistoryDTO> {
  const student = await StudentsRepo.findStudentById(studentId);
  if (!student) throw new NotFoundError('Student not found');

  const attempts = await AttemptsRepo.findByStudentWithAssignment(studentId);

  const history: AttemptHistoryItem[] = attempts.map((a) => ({
    attemptId: a.id,
    assignmentId: a.assignmentId,
    classroomId: a.Assignment.classroomId,
    type: a.Assignment.type,
    mode: a.Assignment.mode,
    score: a.score,
    total: a.total,
    percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
    completedAt: a.completedAt ? a.completedAt.toISOString() : a.startedAt.toISOString(),
    wasMastery: a.total > 0 && a.score === a.total,
    opensAt: a.Assignment.opensAt.toISOString(),
    closesAt: a.Assignment.closesAt ? a.Assignment.closesAt.toISOString() : null,
  }));

  return {
    student: { id: student.id, name: student.name, username: student.username },
    attempts: history,
  };
}

// -----------------------------
// Roster + setup codes
// -----------------------------

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

  // Student table creation inputs (NO level here)
  const createInputs = students.map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    username: s.username,
  }));

  const { created, roster } = await StudentsRepo.createManyForClassroom(classroomId, createInputs);

  // Build map by username for starting progression seed
  const inputByUsername = new Map<
    string,
    { startingOperation?: OperationCode; startingLevel?: number }
  >();

  for (const s of students) {
    inputByUsername.set(s.username, {
      startingOperation: s.startingOperation,
      startingLevel: s.startingLevel,
    });
  }
  // Initialize StudentProgress for each created student (policy-aware + reusable)
  for (const c of created) {
    const meta = inputByUsername.get(c.username);

    await initializeStudentProgressForNewStudent({
      classroomId,
      studentId: c.id,
      startingOperation: meta?.startingOperation,
      startingLevel: meta?.startingLevel,
    });
  }

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
  input: { name: string; username: string };
};

export async function updateClassroomStudentById(
  args: UpdateStudentArgs,
): Promise<StudentRosterRow> {
  const { teacherId, classroomId, studentId, input } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const existing = await StudentsRepo.findStudentByIdInClassroom(classroomId, studentId);
  if (!existing) throw new NotFoundError('Student not found');

  await StudentsRepo.updateById(studentId, { name: input.name, username: input.username });

  const roster = await getClassroomRosterWithLatestAttempt(classroomId);
  const updated = roster.find((s) => s.id === studentId);
  if (!updated) throw new NotFoundError('Student not found after update');

  return updated;
}

export type DeleteStudentArgs = { teacherId: number; classroomId: number; studentId: number };

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

  if (deleteAssignments) await AssignmentsRepo.deleteAssignmentsByClassroomId(classroomId);
  if (deleteSchedules) await SchedulesRepo.deleteSchedulesByClassroomId(classroomId);
}
