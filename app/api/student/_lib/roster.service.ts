import { NotFoundError } from '@/core/errors';
import * as StudentsRepo from '@/data/students.repo';
// --- Types for roster / teacher dashboard ---

export type StudentRosterRow = {
  id: number;
  name: string;
  username: string;
  password: string;
  level: number;
  lastAttempt: any | null; // matches what findStudentsWithLatestAttempt returns
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

  // TODO: If you enforce that teacher owns the classroom, check that here.

  const roster = await StudentsRepo.createManyForClassroom(classroomId, students);
  return roster;
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

  // Reuse your existing roster helper so lastAttempt shape stays consistent
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

  // If you want to clean up attempts first, you can do that here:
  // await AttemptsRepo.deleteByStudent(studentId); // if you add such a function

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

  // Optional cascading behavior — you can wire these up later with Repos

  if (deleteAssignments) {
    // e.g. await AttemptsRepo.deleteByClassroom(classroomId);
    // e.g. await AssignmentsRepo.deleteByClassroom(classroomId);
  }

  if (deleteSchedules) {
    // e.g. await SchedulesRepo.deleteByClassroom(classroomId);
  }

  await StudentsRepo.deleteByClassroomId(classroomId);
}
