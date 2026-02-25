import * as StudentsRepo from '@/data/students.repo';
import * as AttemptsRepo from '@/data/attempts.repo';
import * as SchedulesRepo from '@/data/assignmentSchedules.repo';
import * as AssignmentsRepo from '@/data/assignments.repo';

import { NotFoundError } from '@/core/errors';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';

import { initializeStudentProgressForNewStudent } from '@/core/progression/initStudentProgress.service';
import { getClassroomRosterWithLatestAttempt } from './roster.service';

import type { OperationCode } from '@/types/enums';
import type {
  AttemptHistoryItemDTO,
  StudentHistoryResponse,
  UpdateStudentArgs,
  DeleteStudentArgs,
  DeleteAllStudentsArgs,
  BulkAddStudentsArgs,
  BulkAddResponseDTO,
} from '@/types/api/teacherStudents';

import type { SetupCodeCardDTO } from '@/types/api/roster';
import { percent } from '@/utils';
import { getProgressionSnapshot } from '../progression';

// -----------------------------
// Student history (student + teacher progress pages)
// -----------------------------

export async function getStudentHistory(studentId: number): Promise<StudentHistoryResponse> {
  const student = await StudentsRepo.findStudentById(studentId);
  if (!student) throw new NotFoundError('Student not found');

  const attempts = await AttemptsRepo.findByStudentWithAssignment(studentId);

  const history: AttemptHistoryItemDTO[] = attempts.map((a) => ({
    attemptId: a.id,
    assignmentId: a.assignmentId,
    classroomId: a.Assignment.classroomId,

    type: a.Assignment.type,
    mode: a.Assignment.mode,

    score: a.score,
    total: a.total,
    percent: percent(a.score, a.total),
    completedAt: (a.completedAt ?? a.startedAt).toISOString(),
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

export async function bulkCreateClassroomStudents(
  args: BulkAddStudentsArgs,
): Promise<BulkAddResponseDTO> {
  const { teacherId, classroomId, students } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  const createInputs = students.map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    username: s.username,
  }));

  const { created } = await StudentsRepo.createManyForClassroom(classroomId, createInputs);

  // Map username -> starting meta (so we can init StudentProgress correctly)
  const inputByUsername = new Map<string, { op?: OperationCode; level?: number }>();
  for (const s of students) {
    inputByUsername.set(s.username, {
      op: s.startingOperation,
      level: s.startingLevel,
    });
  }

  // Initialize StudentProgress rows for each created student (policy-aware)
  for (const c of created) {
    const meta = inputByUsername.get(c.username);

    await initializeStudentProgressForNewStudent({
      classroomId,
      studentId: c.id,
      startingOperation: meta?.op,
      startingLevel: meta?.level,
    });
  }

  const setupCodes: SetupCodeCardDTO[] = created.map((c) => ({
    studentId: c.id,
    username: c.username,
    setupCode: c.setupCode,
    expiresAt: (c.setupCodeExpiresAt ?? new Date()).toISOString(),
    name: c.name,
  }));

  const policy = await getProgressionSnapshot(classroomId);
  const primaryOperation: OperationCode = policy.primaryOperation;

  const rawRoster = await StudentsRepo.findStudentsWithLatestAttempt(classroomId, primaryOperation);

  const roster = rawRoster.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    mustSetPassword: s.mustSetPassword,
    lastAttempt: s.lastAttempt,
    progress: [{ operation: primaryOperation, level: s.level }],
  }));

  return { setupCodes, students: roster };
}

// -----------------------------
// Update / delete single student
// -----------------------------

export async function updateClassroomStudentById(args: UpdateStudentArgs) {
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

export async function deleteAllClassroomStudents(args: DeleteAllStudentsArgs): Promise<void> {
  const { teacherId, classroomId, deleteAssignments, deleteSchedules } = args;

  await assertTeacherOwnsClassroom(teacherId, classroomId);

  await StudentsRepo.deleteStudentsByClassroomId(classroomId);

  if (deleteAssignments) await AssignmentsRepo.deleteAssignmentsByClassroomId(classroomId);
  if (deleteSchedules) await SchedulesRepo.deleteSchedulesByClassroomId(classroomId);
}
